import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:2895',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:2895',
        ws: true
      },
      '/media': {
        target: 'http://localhost:2895',
        changeOrigin: true
      }
    }
  }
});
