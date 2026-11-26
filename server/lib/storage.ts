import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getStorageStatus, isServerlessRuntime } from './config';

export interface StoreSchema {
  enquiries: any[];
  demos: any[];
  contacts: any[];
  quotations?: any[];
  auditLogs: any[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'daytech-store.json');

export function generateReference(prefix: 'DTQ' | 'DTD' | 'DTC' | 'QTE'): string {
  const year = new Date().getFullYear();
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${year}-${code}`;
}

export function canUseLocalJsonStore(env: NodeJS.ProcessEnv = process.env): boolean {
  if (isServerlessRuntime(env)) return false;
  const status = getStorageStatus(env);
  return status.provider === 'local-file-store' || status.provider === 'firestore+local';
}

export function ensureLocalStore(): StoreSchema {
  if (!canUseLocalJsonStore()) {
    throw new Error(
      'Local JSON file storage is disabled in serverless environments. Use Cloud Firestore for durable production records.'
    );
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: StoreSchema = {
      enquiries: [],
      demos: [],
      contacts: [],
      quotations: [],
      auditLogs: [],
    };
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(initial, null, 2), 'utf8');
    fs.renameSync(tmpFile, DATA_FILE);
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw) as StoreSchema;
  if (!Array.isArray(parsed.quotations)) {
    parsed.quotations = [];
  }
  return parsed;
}

export function saveLocalStore(store: StoreSchema): void {
  if (!canUseLocalJsonStore()) {
    throw new Error('Local JSON file storage is disabled in serverless environments.');
  }
  const tmpFile = `${DATA_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}
