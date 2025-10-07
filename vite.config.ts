import { defineConfig } from "vite";
// import { VitePWA } from "vite-plugin-pwa";
import classManglerPlugin from "./vite-plugins/vite-class-mangler";
import removeHtmlCommentsPlugin from "./vite-plugins/remove-html-comments";

const idToChunk = new Map();
const reservedChunks = new Set(["_1", "0"]);
const ChunkIdConfig = { min: 1, max: 8 };

export default defineConfig({
  plugins: [
    // VitePWA({
    //   registerType: "autoUpdate",
    //   injectRegister: 'auto',
    //   devOptions: { enabled: false },
    //   manifest: {
    //     name: "Lyrprep",
    //     short_name: "Lyrprep",
    //     description:
    //       "A beautiful, minimal tool for preprocessing lyrics with real-time conversion and LRCLIB API and Spicy Lyrics API integration.",
    //     start_url: "/",
    //     display: "standalone",
    //     background_color: "#f8f9fa",
    //     theme_color: "#28a745",
    //     orientation: "portrait-primary",
    //     icons: [
    //       { src: "icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
    //       { src: "icon-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    //       { src: "icon-large.png", sizes: "512x512", type: "image/png", purpose: "any" },
    //       { src: "icon-large-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    //     ],
    //     categories: ["utilities", "music", "productivity"],
    //     screenshots: [],
    //   },
    //   workbox: {
    //     navigateFallbackDenylist: [/^\/guide(\/.*)?$/],
    //     globPatterns: ["**/*.{js,css,html,png,gif,svg,woff,woff2,ttf,eot}"],
    //     runtimeCaching: [
    //       {
    //         urlPattern: ({ request }) => request.destination === "image",
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "external-images",
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 60 * 24 * 30,
    //           },
    //         },
    //       },
    //       {
    //         urlPattern: ({ request }) => request.destination === "font",
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "external-fonts",
    //           expiration: {
    //             maxEntries: 30,
    //             maxAgeSeconds: 60 * 60 * 24 * 365,
    //           },
    //         },
    //       },
    //       {
    //         urlPattern: /^\/guide\/?$/,
    //         handler: "NetworkFirst",
    //         options: { cacheName: "html-guide" }
    //       }
    //     ],
    //   },
    // }),
    classManglerPlugin({
      length: 20,
      generateMapping: true,
      mappingPath: "class-mapping.json",
      ignore: ["sr-only"],
      skipStartsWith: ["fa", "main__"],
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
            const assigned = idToChunk.get(id);
            if (reservedChunks.has(assigned)) {
              throw new Error(
                `Chunk '${assigned}' is reserved and cannot be used`
              );
            }
            return assigned;
          }

          if (id.includes("/src/") || id.includes("node_modules")) {
            if (id.includes("node_modules")) {
              idToChunk.set(id, "_1");
              return "_1";
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

              // If reserved, increment (wrap around) until non-reserved is found
              let attempts = 0;
              while (reservedChunks.has(chunkId) && attempts < range + 1) {
                chunkNumber = ((chunkNumber - min + 1) % range) + min;
                chunkId = String(chunkNumber);
                attempts++;
              }
              if (reservedChunks.has(chunkId)) {
                throw new Error(
                  `Cannot allocate chunk, chunkId '${chunkId}' is reserved`
                );
              }
              idToChunk.set(id, chunkId);
              return chunkId;
            }
          }
          return undefined;
        },
        chunkFileNames: `_static/js/[hash].[name].js`,
        entryFileNames: `_static/js/[hash].0.js`,
        assetFileNames: "_static/assets/[hash][extname]",
      },
    },
  },
});
