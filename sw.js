// Service Worker for Lyrprep PWA

const CACHE_NAME = 'lyrprep-v6';
// Use scope-relative URLs so this works under subpaths (e.g., /lyrprep/)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js'
];

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
            // Log and continue (use runtime caching for externals or missing files)
            console.warn('Failed to cache asset during install:', asset, e);
          }
        })
      );
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
      ).then(() => self.clients.claim());
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
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then(cache => cache.match('./index.html')))
    );
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
