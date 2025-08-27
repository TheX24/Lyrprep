import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      manifest: {
        name: "Lyrprep",
        short_name: "Lyrprep",
        description:
          "A beautiful, minimal tool for preprocessing lyrics with real-time conversion and LRCLIB API and Spicy Lyrics API integration.",
        start_url: "/",
        display: "standalone",
        background_color: "#f8f9fa",
        theme_color: "#28a745",
        orientation: "portrait-primary",
        icons: [
            { src: "icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "icon-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "icon-large.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "icon-large-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        categories: ["utilities", "music", "productivity"],
        screenshots: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2,ttf,eot}"],
        runtimeCaching: [
          // External Image Caching
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "external-images",
              expiration: {
                maxEntries: 100, // only keep 100 images
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // External Font Caching
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "external-fonts",
              expiration: {
                maxEntries: 30, // only keep 30 fonts
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
});
