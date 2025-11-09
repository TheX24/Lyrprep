import { defineConfig } from "vite";
// import { VitePWA } from "vite-plugin-pwa";
import classManglerPlugin from "./vite-plugins/vite-class-mangler";
import removeHtmlCommentsPlugin from "./vite-plugins/remove-html-comments";

const idToChunk = new Map();
const VENDOR_CHUNK_COUNT = 40;
const reservedChunks = new Set(["entry", "preload", "g20"]);
for (let i = 0; i < VENDOR_CHUNK_COUNT; i++) {
  reservedChunks.add(String(i));
}

// Re-instating this config
const ChunkIdConfig = { min: (VENDOR_CHUNK_COUNT), max: 10000 };

const randomString = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; ++i) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const buildString = randomString();

export default defineConfig({
  plugins: [
    classManglerPlugin({
      min: 3,
      max: 8,
      generateMapping: true,
      classNameGeneratorAlg: "generic",
      mappingPath: "class-mapping.json",
      skipStartsWith: ["fa", "lucide"],
      ignore: ["v_appRoot", "note", "tip", "warning", "important", "caution"]
    }),
    removeHtmlCommentsPlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        guide: "guide/index.html",
        transfer: "transfer/index.html",
      },
      output: {
        manualChunks(id) {
          // --- Caching Logic ---
          // This part is good, let's keep it.
          if (idToChunk.has(id)) {
            return idToChunk.get(id);
          }

          if (id.includes("instantStore.ts") || id.includes("wdelivery/main.ts")) {
            const chunkId = "g20"; // Name it anything
            idToChunk.set(id, chunkId);
            return chunkId;
         }

          // --- Preload Polyfill Chunk ---
          // This is good, keep it.
          if (id.includes("modulepreload-polyfill")) {
            idToChunk.set(id, "preload");
            return "preload";
          }

          // --- Vendor Chunking Logic ---
          // This logic is great for splitting node_modules. Let's keep it.
          if (id.includes('node_modules')) {
            let chunkId = '0';

            const match = id.match(/node_modules\/((?:@[^/]+\/[^/]+)|(?:[^/]+))/);

            if (match) {
              const packageName = match[1];

              const hash = Array.from(packageName).reduce(
                (acc, char) => acc + char.charCodeAt(0),
                0
              );
              
              chunkId = String(hash % VENDOR_CHUNK_COUNT);
            }

            idToChunk.set(id, chunkId);
            return chunkId;
          }

          // --- /src/ Chunking Logic (RESTORED & FIXED) ---
          if (id.includes("/src/")) {
            const min = ChunkIdConfig.min;
            const max = ChunkIdConfig.max;
            const range = max - min + 1;

            // Using a better hash function (djb2) to reduce initial collisions
            let hash = 5381;
            for (let i = 0; i < id.length; i++) {
              // (hash * 33) is a "magic number" that works well
              hash = (hash * 33) ^ id.charCodeAt(i);
            }
            hash = Math.abs(hash);

            // Use the hash directly for chunking, not Math.sin
            let chunkNumber = (hash % range) + min;
            let chunkId = String(chunkNumber);

            let attempts = 0;
            // This is the key fix:
            // We loop as long as reservedChunks *already contains* this chunkId.
            // This checks against vendor chunks AND other /src/ chunks
            // that have already been allocated.
            while (reservedChunks.has(chunkId) && attempts < range) {
              chunkNumber = ((chunkNumber - min + 1) % range) + min;
              chunkId = String(chunkNumber);
              attempts++;
            }

            if (reservedChunks.has(chunkId)) {
              // This should now be extremely unlikely
              throw new Error(
                `Cannot allocate chunk for /src/ file, all attempts failed. Last try: '${chunkId}' for id: ${id}`
              );
            }
            
            // This is the *other* part of the fix:
            // Once we find a free chunk, we *reserve it* so no other
            // file can take it, preventing collisions.
            reservedChunks.add(chunkId);

            // And finally, cache this decision.
            idToChunk.set(id, chunkId);
            return chunkId;
          }


          // By returning undefined here for any other files,
          // we let Rollup decide the best way to chunk them.
          return undefined;
        },
        chunkFileNames: `_vitestatic/js/chunks/[name].[hash].${buildString}.js`,
        entryFileNames: `_vitestatic/js/entry.[hash].${buildString}.js`,
        assetFileNames: `_vitestatic/assets/[extname]/${buildString}.[hash][extname]`,
      },
    },
  },
});