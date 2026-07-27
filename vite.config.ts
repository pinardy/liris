import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Liris — Music Player',
        short_name: 'Liris',
        description:
          'Free music player: stream Creative Commons music from Jamendo and play your own files, fully offline.',
        display: 'standalone',
        start_url: '/',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Search',
            url: '/search',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Your Library',
            url: '/library',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Favorites',
            url: '/favorites',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        // IMPORTANT: audio stream URLs (prod-*.jamendo.com) must NOT match any
        // runtime route — audio relies on HTTP Range requests, which a cached
        // response would break. Passthrough to network is the correct behavior.
        runtimeCaching: [
          {
            // StaleWhileRevalidate: repeat visits render instantly from cache
            // while a background fetch refreshes the entry.
            urlPattern: /^https:\/\/api\.jamendo\.com\/v3\.0\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'jamendo-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/usercontent\.jamendo\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jamendo-artwork',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Item metadata only — /download/ (audio) must stay unrouted.
            urlPattern: /^https:\/\/archive\.org\/metadata\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'archive-metadata',
              expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/archive\.org\/services\/img\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'archive-artwork',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
