import { generateKeyPairSync } from 'node:crypto';
import { matchesGlob } from 'node:path';
import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { createApiApp } from './app';
import { getServerFirebaseConfig, validPreviewRuntime } from './lib/config';
import { createFirestoreStore } from './lib/firestoreStore';
import { resolveFirebaseConfig } from '../src/lib/firebase/config';
import applet from '../firebase-applet-config.json';
import vercel from '../vercel.json';

const project = 'daytech-acceptance-preview';
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const identity = {
  type: 'service_account', project_id: project, client_email: `daytech-preview-runtime@${project}.iam.gserviceaccount.com`,
  token_uri: 'https://oauth2.googleapis.com/token', private_key: privateKey,
};
const preview = {
  VERCEL: '1', VERCEL_ENV: 'preview',
  VITE_FEATURE_FIREBASE: 'true', VITE_FIREBASE_PROJECT_ID: project, VITE_FIREBASE_DATABASE_ID: '(default)',
  VITE_FIREBASE_API_KEY: 'AIza' + 'a'.repeat(35), VITE_FIREBASE_AUTH_DOMAIN: project + '.firebaseapp.com',
  VITE_FIREBASE_STORAGE_BUCKET: project + '.firebasestorage.app', VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
  VITE_FIREBASE_APP_ID: '1:123:web:abc', FIRESTORE_SERVICE_ACCOUNT_JSON: JSON.stringify(identity),
  APP_URL: 'https://preview-fixture.vercel.app', DAYTECH_PREVIEW_ORIGIN: 'https://preview-fixture.vercel.app',
  VITE_FEATURE_PAYMENTS: 'false', VITE_FEATURE_GOOGLE_CALENDAR: 'false', VITE_FEATURE_WHATSAPP: 'false', VITE_FEATURE_LIVE_VOICE: 'false',
  GROWTH_HASH_SECRET: 'g'.repeat(32), QUOTATION_LINK_SECRET: 'q'.repeat(32),
};

describe('preview isolation', () => {
  it('disables production fallback across targets and retains normal production resolution', () => {
    expect(getServerFirebaseConfig({ VERCEL: '1' }).projectId).toBeNull();
    expect(getServerFirebaseConfig({ DAYTECH_ENV: 'local' }).projectId).toBeNull();
    expect(getServerFirebaseConfig({ VERCEL: '1', VERCEL_ENV: 'production' }).projectId).toBe(applet.projectId);
    expect(resolveFirebaseConfig({ VITE_DAYTECH_PREVIEW: 'true' }).config).toBeNull();
    expect(resolveFirebaseConfig({ ...preview, VITE_DAYTECH_PREVIEW: 'true' }).config?.projectId).toBe(project);
    expect(resolveFirebaseConfig({ ...preview, VITE_FIREBASE_API_KEY: applet.apiKey }).config).toBeNull();
    expect(getServerFirebaseConfig({ ...preview, VITE_FIREBASE_PROJECT_ID: applet.projectId }).projectId).toBeNull();
  });

  it('requires preview-only identity, services, and independent secrets', () => {
    expect(validPreviewRuntime(preview)).toBe(true);
    expect(validPreviewRuntime({ ...preview, FIRESTORE_SERVICE_ACCOUNT_JSON: JSON.stringify({ ...identity, project_id: applet.projectId }) })).toBe(false);
    expect(validPreviewRuntime({ ...preview, FIRESTORE_SERVICE_ACCOUNT_JSON: JSON.stringify({ ...identity, token_uri: 'https://example.invalid' }) })).toBe(false);
    expect(validPreviewRuntime({ ...preview, QUOTATION_LINK_SECRET: preview.GROWTH_HASH_SECRET })).toBe(false);
    expect(validPreviewRuntime({ ...preview, VITE_FEATURE_LIVE_VOICE: undefined })).toBe(false);
    expect(validPreviewRuntime({ ...preview, APP_URL: 'https://another-origin.vercel.app' })).toBe(false);
  });

  it('rejects API and direct storage operations before using auth or cloud credentials', async () => {
    const env = { ...preview, FIRESTORE_SERVICE_ACCOUNT_JSON: undefined };
    const verifyToken = vi.fn();
    const server = createApiApp({ env, adminAuthDeps: { verifyToken } }).listen(0, '127.0.0.1');
    try {
      await once(server, 'listening');
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing test address');
      const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/overview`, { headers: { Authorization: 'Bearer synthetic' } });
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(verifyToken).not.toHaveBeenCalled();
      await expect(createFirestoreStore(env).get('growthLeads/synthetic')).rejects.toMatchObject({ status: 503 });
    } finally {
      server.close();
    }
  });

  it('excludes development and CI branches without an overlapping positive rule', () => {
    const enabled = (branch: string) => {
      const rules = Object.entries(vercel.git.deploymentEnabled).filter(([pattern]) => matchesGlob(branch, pattern));
      return rules.length === 0 || rules.some(([, active]) => active);
    };
    expect(['codex/daytech-increment-6', 'ci/daytech/check', 'dev', 'develop', 'dev/nested/branch'].map(enabled)).toEqual([false, false, false, false, false]);
    expect(enabled('main')).toBe(true);
  });
});
