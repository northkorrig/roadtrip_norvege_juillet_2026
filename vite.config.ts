import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Horodatage du build, affiché discrètement sur l'accueil pour vérifier
  // quelle version tourne (utile face au cache du service worker PWA).
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Norvège — Road Trip Fjords & Montagnes',
        short_name: 'Norvège 2026',
        description:
          'Itinéraire, POIs, budget et logistique du road trip en Norvège · 14 → 26 juillet 2026.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0D1B2A',
        background_color: '#0D1B2A',
        categories: ['travel', 'navigation', 'lifestyle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Précache de tout le shell applicatif (rendu offline depuis localStorage)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // Ne pas intercepter les routes de partage côté serveur ni l'API
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // skipWaiting : le nouveau service worker prend la main IMMÉDIATEMENT au
        // lieu d'attendre la fermeture de tous les onglets/instances. Sans lui,
        // sur une PWA installée qui ne se ferme jamais vraiment, l'ancienne
        // version restait servie indéfiniment — les correctifs n'arrivaient pas.
        skipWaiting: true,
        runtimeCaching: [
          {
            // Feuilles de style Google Fonts
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Fichiers de police (immutables, cache long)
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Maps JS API + assets (best-effort hors-ligne ; les tuiles
            // restent tributaires du réseau)
            urlPattern: ({ url }) =>
              url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-maps',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Photos Wikipédia du pokédex : une fois chargées, elles restent
            // disponibles hors-ligne (fjords sans réseau)
            urlPattern: ({ url }) => url.hostname === 'upload.wikimedia.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikipedia-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
