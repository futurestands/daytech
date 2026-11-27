import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import firebaseAppletConfig from './firebase-applet-config.json' with { type: 'json' };
import { needsPreviewIsolation, previewIntegrationsDisabled, validPreviewWebConfig } from './src/config/previewIsolation.ts';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const preview = needsPreviewIsolation(env);
  if (preview && (!validPreviewWebConfig(env, firebaseAppletConfig.apiKey) || !previewIntegrationsDisabled(env))) {
    throw new Error('Preview build requires isolated Firebase Web configuration and disabled optional integrations.');
  }
  return {
    define: preview ? { 'import.meta.env.VITE_DAYTECH_PREVIEW': JSON.stringify('true') } : undefined,
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
