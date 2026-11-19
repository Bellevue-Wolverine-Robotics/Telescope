import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
    tailwindcss()
  ],
}));
