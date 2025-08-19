// Service Worker for Lyrprep PWA

const CACHE_NAME = 'lyrprep-v6';
// Use scope-relative URLs so this works under subpaths (e.g., /lyrprep/)
// Do not include './' to avoid opaqueredirect caching issues on some hosts
const ASSETS_TO_CACHE = [
  './index.html',
  './styles.css',
  './app.js'
];

// Minimal offline fallback for first-time offline visits (when nothing is cached yet)
const OFFLINE_FALLBACK_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#0b0b0b;color:#eee}main{max-width:640px;padding:24px;text-align:center;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.02);backdrop-filter:blur(4px)}h1{font-size:1.5rem;margin:.25rem 0 1rem}p{opacity:.8;line-height:1.5}</style></head><body><main><h1>You're offline</h1><p>This app needs a network connection the first time you open it so we can save files for offline use. Please reconnect and reload.</p></main></body></html>`;

// Install event - cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Add assets individually so one failure doesn't abort the whole install
      await Promise.all(
        ASSETS_TO_CACHE.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (e) {
            console.warn('Failed to cache asset during install:', asset, e);
          }
        })
      );

      // Ensure a fresh index.html is cached (bypass HTTP cache)
      try {
        await cache.add(new Request('./index.html', { cache: 'reload' }));
      } catch (e) {
        console.warn('Failed to force-cache index.html with reload:', e);
      }
    })
  );
  self.skipWaiting();
});  

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
      .then(() => {
        if (self.registration.navigationPreload) {
          return self.registration.navigationPreload.enable();
        }
      })
      .then(() => self.clients.claim());
    })
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http/s requests
  if (!event.request.url.startsWith('http')) return;
  
  // Skip LRCLIB API requests (we want fresh data)
  if (event.request.url.includes('lrclib.net') || event.request.url.includes('spicylyrics.org') || event.request.url.includes('hcaptcha.com')) {
    return;
  }

  // Network-first for navigations/HTML to ensure latest shell
  const acceptHeader = event.request.headers.get('accept') || '';
  if (event.request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith((async () => {
      try {
        // Use any preloaded response first for faster first-loads
        const preloaded = event.preloadResponse ? await event.preloadResponse : null;
        if (preloaded) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, preloaded.clone());
          return preloaded;
        }

        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
        // Offline: return cached index, or a minimal offline page if not yet cached
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('./index.html');
        if (cached) return cached;
        return new Response(OFFLINE_FALLBACK_HTML, { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }
  
  // Cache-first for other GETs, scoped to the current cache only
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);
          return networkResponse;
        });
      })
    )
  );
});

// Listen for message event (can be used for cache invalidation)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
