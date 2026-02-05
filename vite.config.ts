import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
  server: {
    allowedHosts: true,
  },
});
