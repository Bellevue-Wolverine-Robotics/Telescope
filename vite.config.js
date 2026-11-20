import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from https://<org>.github.io/Telescope/ on GitHub Pages
  base: command === 'build' ? '/Telescope/' : '/',
  server: { allowedHosts: true },
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
}));
