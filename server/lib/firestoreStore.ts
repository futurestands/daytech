import { GoogleAuth } from 'google-auth-library';
import { getServerFirebaseConfig } from './config';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };
type Fields = Record<string, Value>;
type Value = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  mapValue?: { fields: Fields };
  arrayValue?: { values?: Value[] };
};

export interface FirestoreDocument {
  name: string;
  updateTime: string;
  fields: Fields;
}

type Condition = { exists: false } | { updateTime: string };
export type FirestoreWrite =
  | { update: { name: string; fields: Fields }; currentDocument: Condition }
  | { delete: string; currentDocument: Condition };

function encode(value: Json): Value {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: encodeFields(value) } };
}

function encodeFields(data: Record<string, Json | undefined>): Fields {
  return Object.fromEntries(Object.entries(data).flatMap(([key, value]) =>
    value === undefined ? [] : [[key, encode(value)]]
  ));
}

export class FirestoreStoreError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super('Firestore operation failed.');
  }
}

export function createFirestoreStore(env: NodeJS.ProcessEnv) {
  const cfg = getServerFirebaseConfig(env);
  const emulator = env.NODE_ENV === 'test' && env.FIRESTORE_EMULATOR_HOST;
  const project = emulator ? 'demo-daytech-milestone' : cfg.projectId;
  const database = emulator ? '(default)' : cfg.firestoreDatabaseId;
  const root = `projects/${project}/databases/${database}/documents`;
  const origin = emulator ? `http://${emulator}` : 'https://firestore.googleapis.com';
  let auth: GoogleAuth | undefined;

  async function request(path: string, init?: RequestInit) {
    if (!project || (emulator && !/^127\.0\.0\.1:\d+$/.test(emulator))) {
      throw new FirestoreStoreError(503);
    }
    const headers = new Headers(init?.headers);
    if (!emulator) {
      if (!env.FIRESTORE_SERVICE_ACCOUNT_JSON) throw new FirestoreStoreError(503);
      auth ??= new GoogleAuth({
        credentials: JSON.parse(env.FIRESTORE_SERVICE_ACCOUNT_JSON),
        scopes: ['https://www.googleapis.com/auth/datastore'],
      });
      const token = await auth.getAccessToken();
      if (!token) throw new FirestoreStoreError(503);
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      headers.set('Authorization', 'Bearer owner');
    }
    return fetch(`${origin}/v1/${root}${path}`, { ...init, headers, signal: AbortSignal.timeout(10_000) });
  }

  async function assertOk(res: Response) {
    if (res.ok) return;
    const data = await res.json().catch(() => null);
    throw new FirestoreStoreError(res.status, data?.error?.status);
  }

  return {
    async get(path: string): Promise<FirestoreDocument | null> {
      const response = await request('/' + path);
      if (response.status === 404) return null;
      await assertOk(response);
      return response.json();
    },
    async count(collection: string, filters: object[]) {
      const response = await request(':runAggregationQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredAggregationQuery: {
          structuredQuery: {
            from: [{ collectionId: collection }],
            ...(filters.length && { where: { compositeFilter: { op: 'AND', filters } } }),
          },
          aggregations: [{ alias: 'total', count: {} }],
        } }),
      });
      await assertOk(response);
      const rows = await response.json() as { result?: { aggregateFields: { total: { integerValue: string } } } }[];
      return Number(rows.find(row => row.result)?.result?.aggregateFields.total.integerValue ?? 0);
    },
    async query(collection: string, filters: object[], limit: number, cursor?: { createdAt: string; id: string }): Promise<FirestoreDocument[]> {
      const response = await request(':runQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collection }],
            ...(filters.length && { where: { compositeFilter: { op: 'AND', filters } } }),
            orderBy: [
              { field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' },
              { field: { fieldPath: '__name__' }, direction: 'DESCENDING' },
            ],
            ...(cursor && { startAt: { before: false, values: [
              { timestampValue: cursor.createdAt }, { referenceValue: `${root}/${collection}/${cursor.id}` },
            ] } }),
            limit,
          },
        }),
      });
      await assertOk(response);
      const rows = await response.json() as { document?: FirestoreDocument }[];
      return rows.flatMap(row => row.document ? [row.document] : []);
    },
    async list(path: string): Promise<FirestoreDocument[]> {
      const documents: FirestoreDocument[] = [];
      let pageToken = '';
      do {
        const query = new URLSearchParams({ pageSize: '100' });
        if (pageToken) query.set('pageToken', pageToken);
        const response = await request(`/${path}?${query}`);
        await assertOk(response);
        const data = await response.json();
        documents.push(...(data.documents ?? []));
        pageToken = data.nextPageToken ?? '';
      } while (pageToken);
      return documents;
    },
    put(path: string, data: Record<string, Json | undefined>, condition: Condition, timestamps: string[] = []): FirestoreWrite {
      const fields = encodeFields(data);
      const now = new Date().toISOString();
      for (const key of timestamps) fields[key] = { timestampValue: now };
      return { update: { name: `${root}/${path}`, fields }, currentDocument: condition };
    },
    async commit(writes: FirestoreWrite[]) {
      const response = await request(':commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writes }),
      });
      await assertOk(response);
    },
  };
}

export type FirestoreStore = ReturnType<typeof createFirestoreStore>;
