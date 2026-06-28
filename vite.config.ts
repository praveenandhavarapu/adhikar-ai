import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config. The dev proxy lets `vite dev` talk to `netlify dev`'s
// function server on :8888 so the front-end can call /api/* locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
