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
  const devAuthBypassRequested = env.DEV_BYPASS_AUTH === 'true';

  if (mode === 'production' && devAuthBypassRequested) {
    throw new Error('DEV_BYPASS_AUTH may only be enabled in development mode.');
  }

  const devAuthBypassEnabled = mode === 'development' && devAuthBypassRequested;

  return {
    define: {
      __LANDING_PAGE_ENABLED__: JSON.stringify(landingPageEnabled),
      __DEV_AUTH_BYPASS_ENABLED__: JSON.stringify(devAuthBypassEnabled),
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
