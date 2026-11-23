import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Defaults to the site root. Deploys under a sub-path (e.g. GitHub Pages) set BASE_PATH.
  base: process.env.BASE_PATH || '/',
  server: { allowedHosts: true },
  // Shown in Settings > About. The deploy workflow sets BUILD_NUMBER; local builds show "dev".
  define: {
    __BUILD_NUMBER__: JSON.stringify(process.env.BUILD_NUMBER || 'dev'),
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    // Service worker that caches the whole app, so it opens and works with no connection
    VitePWA({
      // Keep using public/site.webmanifest rather than generating one
      manifest: false,
      // A new version waits until every Telescope tab is closed, then takes over on the next
      // launch. Never reloads the page by itself, so a half-filled form isn't lost.
      registerType: 'prompt',
      injectRegister: 'script-defer',
      workbox: {
        // Everything the app needs, including the QR scanner's WebAssembly decoder
        globPatterns: ['**/*.{js,css,html,wasm,svg,png,ico,webmanifest}'],
        // The QR decoder is about 0.9 MB
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Pages like /scouting/match are handled by the app, so serve index.html for them
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
