import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_URL || './',
  build: {
    target: 'esnext',
  },
  optimizeDeps: {},
  server: {
    allowedHosts: true,
    strictPort: false,
  },
  clearScreen: false,
});
