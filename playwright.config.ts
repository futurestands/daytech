import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  use: {
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.DAYTECH_TEST_CHROMIUM },
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js build --outDir dist-e2e && node node_modules/vite/bin/vite.js preview --outDir dist-e2e --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    env: { VITE_FEATURE_FIREBASE: 'false', VITE_FEATURE_LIVE_VOICE: 'false', VITE_GOOGLE_MAPS_API_KEY: '' },
  },
});
