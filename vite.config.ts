/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import Inspector from 'vite-plugin-react-inspector'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // These variables intentionally have no VITE_ prefix: they are consumed here
  // at build time rather than being exposed as general browser environment vars.
  const env = loadEnv(mode, process.cwd(), '');
  const landingPageEnabled = env.landing_page !== 'false';
  const signInPageEnabled = env.sign_in_page !== 'false';

  return {
    define: {
      __LANDING_PAGE_ENABLED__: JSON.stringify(landingPageEnabled),
      __SIGN_IN_PAGE_ENABLED__: JSON.stringify(signInPageEnabled),
    },
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
  };
});
