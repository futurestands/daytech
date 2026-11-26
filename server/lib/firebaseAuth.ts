import crypto from 'crypto';
import { getServerFirebaseConfig } from './config';

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: { certs: Record<string, string>; expiresAtMs: number } | null = null;

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  emailVerified: boolean;
  issuer: string;
  audience: string;
  exp: number;
  iat: number;
}

export async function fetchGoogleFirebaseCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < cachedCerts.expiresAtMs) {
    return cachedCerts.certs;
  }
  const res = await fetch(FIREBASE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase public keys (${res.status}).`);
  }
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const certs = (await res.json()) as Record<string, string>;
  cachedCerts = {
    certs,
    expiresAtMs: now + Math.max(60, maxAgeSeconds) * 1000,
  };
  return certs;
}

function decodeJwtPart<T>(segment: string): T {
  const json = Buffer.from(segment, 'base64url').toString('utf8');
  return JSON.parse(json) as T;
}

export interface VerifyTokenOptions {
  projectId?: string;
  nowSeconds?: number;
  certsOverride?: Record<string, string>;
}

/**
 * Verifies a Firebase Authentication ID token (RS256) using Google's public x509 certs.
 * Requires zero IAM roles or service account keys.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  options: VerifyTokenOptions = {}
): Promise<VerifiedFirebaseToken> {
  const parts = idToken.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase ID token.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeJwtPart<{ alg?: string; kid?: string }>(headerB64);
  const payload = decodeJwtPart<{
    iss?: string;
    aud?: string;
    sub?: string;
    user_id?: string;
    email?: string;
    email_verified?: boolean;
    exp?: number;
    iat?: number;
    auth_time?: number;
  }>(payloadB64);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported Firebase token algorithm or missing key ID.');
  }

  const projectId = options.projectId || getServerFirebaseConfig().projectId;
  if (!projectId) {
    throw new Error('Firebase project ID is not configured on the server.');
  }

  const certs = options.certsOverride ?? (await fetchGoogleFirebaseCerts());
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Firebase token signing key not recognised or rotated.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const signature = Buffer.from(signatureB64, 'base64url');
  if (!verifier.verify(certPem, signature)) {
    throw new Error('Invalid Firebase token signature.');
  }

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId) {
    throw new Error('Firebase token audience mismatch.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Firebase token issuer mismatch.');
  }
  const uid = (payload.sub || payload.user_id || '').trim();
  if (!uid || uid.length > 128) {
    throw new Error('Firebase token missing valid subject UID.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
    throw new Error('Firebase token has expired.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSeconds + 300) {
    throw new Error('Firebase token issued-at timestamp is invalid.');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > nowSeconds + 300) {
    throw new Error('Firebase token auth_time is invalid.');
  }

  return {
    uid,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    issuer: payload.iss,
    audience: payload.aud,
    exp: payload.exp,
    iat: payload.iat,
  };
}

export interface CallerUserDoc {
  uid: string;
  role: string;
  active: boolean;
}

function parseFirestoreField(field: Record<string, unknown> | undefined): unknown {
  if (!field) return undefined;
  if ('stringValue' in field) return field.stringValue;
  if ('booleanValue' in field) return field.booleanValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return Number(field.doubleValue);
  if ('timestampValue' in field) return field.timestampValue;
  return undefined;
}

export function flattenFirestoreDocument(docJson: {
  name?: string;
  fields?: Record<string, Record<string, unknown>>;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (docJson.name) {
    const parts = docJson.name.split('/');
    out.id = parts[parts.length - 1];
  }
  const fields = docJson.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = parseFirestoreField(v);
  }
  return out;
}

/**
 * Fetches a single Firestore document using the caller's own Firebase ID token,
 * meaning Firestore Security Rules enforce access control natively without Admin IAM.
 */
export async function fetchFirestoreDocAsCaller(
  idToken: string,
  collectionPath: string,
  docId: string
): Promise<Record<string, unknown> | null> {
  const cfg = getServerFirebaseConfig();
  if (!cfg.projectId) return null;
  const dbId = encodeURIComponent(cfg.firestoreDatabaseId);
  const safePath = collectionPath
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    cfg.projectId
  )}/databases/${dbId}/documents/${safePath}/${encodeURIComponent(docId)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (res.status === 404 || res.status === 403) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Firestore REST error (${res.status}).`);
  }
  const json = (await res.json()) as { name?: string; fields?: Record<string, Record<string, unknown>> };
  return flattenFirestoreDocument(json);
}

export async function fetchCallerUserAccount(
  idToken: string,
  uid: string
): Promise<CallerUserDoc | null> {
  const data = await fetchFirestoreDocAsCaller(idToken, 'users', uid);
  if (!data) return null;
  return {
    uid: String(data.uid || uid),
    role: String(data.role || 'client'),
    active: Boolean(data.active),
  };
}
