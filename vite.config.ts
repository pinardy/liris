import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://pinardy.github.io/liris/ — every asset, route and
// service-worker scope is relative to this subpath.
const BASE = '/liris/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-96.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Liris Classical',
        short_name: 'Liris',
        description:
          'A free classical music player: browse the canon by composer, period and form, with public-domain recordings you can keep offline.',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
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
        // Shortcut URLs must sit inside `scope`.
        shortcuts: [
          {
            name: 'Search',
            url: `${BASE}search`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Composers',
            url: `${BASE}composers`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Your Library',
            url: `${BASE}library`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Favorites',
            url: `${BASE}favorites`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Large install-time icons are fetched by the OS/browser, not the app,
        // so keeping them out of the precache saves ~270 KB per install.
        globIgnores: ['**/icon-512*.png', '**/apple-touch-icon.png'],
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
          {
            // Composer and work summaries (AboutBlurb). Article intros change
            // rarely; refresh in the background so blurbs work offline.
            urlPattern: /^https:\/\/en\.wikipedia\.org\/(api|w)\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wikipedia-summaries',
              expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Composer portraits. Commons redirects to upload.wikimedia.org, so
            // both hosts need routing; these images never change.
            urlPattern: /^https:\/\/(commons|upload)\.wikimedia\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'composer-portraits',
              expiration: { maxEntries: 80, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
