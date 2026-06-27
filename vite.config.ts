/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import Inspector from 'vite-plugin-react-inspector'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inspector()
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
