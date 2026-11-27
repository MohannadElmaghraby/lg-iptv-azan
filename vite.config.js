import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 53'],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    cssTarget: 'chrome53',
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
