import { defineConfig } from "vite";
// import { VitePWA } from "vite-plugin-pwa";
import classManglerPlugin from "./vite-plugins/vite-class-mangler";
import removeHtmlCommentsPlugin from "./vite-plugins/remove-html-comments";

const idToChunk = new Map();
const VENDOR_CHUNK_COUNT = 40;
const reservedChunks = new Set(["entry", "preload"]);
for (let i = 0; i < VENDOR_CHUNK_COUNT; i++) {
  reservedChunks.add(String(i));
}

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
      skipStartsWith: ["fa"],
      ignore: ["v_appRoot", "note", "tip", "warning", "important", "caution"]
    }),
    removeHtmlCommentsPlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        guide: "guide/index.html",
      },
      output: {
        manualChunks(id) {
          if (idToChunk.has(id)) {
            return idToChunk.get(id);
          }

          if (id.includes("modulepreload-polyfill")) {
            idToChunk.set(id, "preload");
            return "preload";
          }


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

          
          if (id.includes("/src/")) {
            const min = ChunkIdConfig.min;
            const max = ChunkIdConfig.max;
            const range = max - min + 1;
            const hash = Array.from(id).reduce(
              (acc, char) => acc + char.charCodeAt(0),
              0
            );
            let random = Math.abs(Math.sin(hash)) * 10000;
            let chunkNumber = Math.floor(random % range) + min;
            let chunkId = String(chunkNumber);

            let attempts = 0;
            while (reservedChunks.has(chunkId) && attempts < range + 1) {
              chunkNumber = ((chunkNumber - min + 1) % range) + min;
              chunkId = String(chunkNumber);
              attempts++;
            }
            if (reservedChunks.has(chunkId)) {
              throw new Error(
                `Cannot allocate chunk for /src/ file, all attempts failed. Last try: '${chunkId}'`
              );
            }
            idToChunk.set(id, chunkId);
            return chunkId;
          }

          return undefined;
        },
        chunkFileNames: `_vitestatic/js/chunks/[name].[hash].${buildString}.js`,
        entryFileNames: `_vitestatic/js/entry.[hash].${buildString}.js`,
        assetFileNames: `_vitestatic/assets/[extname]/${buildString}.[hash][extname]`,
      },
    },
  },
});
