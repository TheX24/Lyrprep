import { defineConfig } from "vite";
// import { VitePWA } from "vite-plugin-pwa";
import classManglerPlugin from "./vite-plugins/vite-class-mangler";
import removeHtmlCommentsPlugin from "./vite-plugins/remove-html-comments";

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
      mappingPath: 'class-mapping.json',
      ignore: ['sr-only'],
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
          switch (true) {
            case id.includes('modules/Cache.ts'):
              return '1';
            case id.includes('app.ts'):
              return '2';
            case id.includes('font-selector.ts'):
              return '3';
            case id.includes('lucide-icons.ts'):
              return '4';
          }
        },
        chunkFileNames: `_static/js/[hash].[name].js`,
        entryFileNames: `_static/js/[hash].0.js`,
        assetFileNames: "_static/[hash][extname]",
      }
    },
  },
});
