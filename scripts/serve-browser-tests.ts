import express from 'express';
import { resolve } from 'node:path';
import { createApiApp } from '../server/app';

const port = Number(process.env.DAYTECH_BROWSER_PORT ?? 4173);
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
if (emulator && !/^127\.0\.0\.1:\d+$/.test(emulator)) {
  throw new Error('Use a loopback Firestore Emulator for browser tests.');
}
const app = express();
app.use(createApiApp({
  env: { NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: emulator },
}));
const dist = resolve(process.argv[2] ?? 'dist-e2e');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
app.listen(port, '127.0.0.1', () => console.log('Browser test server listening on port ' + port));
