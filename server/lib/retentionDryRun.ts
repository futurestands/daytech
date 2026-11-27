import { createHash, randomUUID } from 'node:crypto';
import { flattenFirestoreDocument } from './firebaseAuth';
import type { FirestoreDocument } from './firestoreStore';

export const retentionTarget = { projectId: 'demo-daytech-milestone', databaseId: '(default)' } as const;
export const retentionCollections = ['growthLeads', 'growthRateLimits', 'auditLogs'] as const;
type Collection = typeof retentionCollections[number];
export type RetentionPolicy = { leadDays: number; partnerDays: number; quotaGraceHours: number; auditDays: number };
type Disposition = 'interest-expired' | 'partner-expired' | 'quota-expired' | 'audit-expired' | 'retain' | 'hold' | 'needs-review' | 'preserve-suppression';
type Page = { documents: FirestoreDocument[]; nextPageToken?: string };
const day = 86_400_000;
const hour = 3_600_000;

export function assertRetentionTarget(projectId: string, databaseId: string, host: string) {
  if (projectId !== retentionTarget.projectId || databaseId !== retentionTarget.databaseId ||
    !/^127\.0\.0\.1:[1-9]\d{0,4}$/.test(host) || Number(host.split(':')[1]) > 65535) {
    throw new Error('Retention dry runs require the dedicated demo project, default database and an explicit loopback emulator.');
  }
}

export function classifyRetention(collection: Collection, fields: Record<string, unknown>, now: number, policy: RetentionPolicy): Disposition {
  if (fields.legalHold === true || fields.investigationHold === true) return 'hold';
  if ([fields.legalHold, fields.investigationHold].some(value => value !== undefined && value !== false)) return 'needs-review';
  if (collection === 'growthLeads') {
    if (fields.status === 'Opted out') return 'preserve-suppression';
    if (['Converted', 'Approved', 'Pilot invited'].includes(String(fields.status))) return 'retain';
    if (!['New', 'Qualified', 'Follow-up', 'Rejected'].includes(String(fields.status)) ||
      !['interest', 'partner'].includes(String(fields.kind))) return 'needs-review';
  }
  if (collection === 'auditLogs' && (fields.retentionClass !== 'security-metadata' || fields.relatedToActiveWork !== false)) return 'needs-review';
  const field = collection === 'growthRateLimits' ? fields.expiresAt
    : collection === 'auditLogs' ? fields.createdAt : fields.lastMeaningfulContactAt ?? fields.updatedAt ?? fields.createdAt;
  const timestamp = typeof field === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(field) ? Date.parse(field) : NaN;
  if (!Number.isFinite(timestamp)) return 'needs-review';
  if (collection === 'growthRateLimits') return now - timestamp >= policy.quotaGraceHours * hour ? 'quota-expired' : 'retain';
  if (collection === 'auditLogs') return now - timestamp >= policy.auditDays * day ? 'audit-expired' : 'retain';
  const partner = fields.kind === 'partner';
  if (now - timestamp < (partner ? policy.partnerDays : policy.leadDays) * day) return 'retain';
  return partner ? 'partner-expired' : 'interest-expired';
}

export function prepareSuppression(id: string, fields: Record<string, unknown>) {
  if (fields.status !== 'Opted out' || !/^[a-f0-9]{64}$/.test(id) ||
    (fields.kind !== 'interest' && fields.kind !== 'partner')) return null;
  const optedOutAt = fields.optedOutAt ?? fields.updatedAt;
  if (typeof optedOutAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(optedOutAt) || !Number.isFinite(Date.parse(optedOutAt))) return null;
  return { digest: id, scope: fields.kind, optedOutAt };
}

export async function runRetentionDryRun(config: {
  projectId: string; databaseId: string; host: string; now: number; policy: RetentionPolicy;
  readPage: (collection: Collection, cursor?: string) => Promise<Page>;
}) {
  const { projectId, databaseId, host, now, policy, readPage } = config;
  assertRetentionTarget(projectId, databaseId, host);
  if (!Number.isFinite(now) || !Object.values(policy).every(value => Number.isSafeInteger(value) && value > 0 && value <= 3650)) {
    throw new Error('Use positive, bounded policy intervals and a valid cutoff time.');
  }
  const hash = createHash('sha256');
  const counts = {} as Record<Collection, { examined: number; dispositions: Partial<Record<Disposition, number>>; truncated: boolean }>;
  for (const collection of retentionCollections) {
    const summary: typeof counts[Collection] = { examined: 0, dispositions: {}, truncated: false };
    counts[collection] = summary;
    const prefix = `projects/${projectId}/databases/${databaseId}/documents/${collection}/`;
    let cursor: string | undefined;
    for (let batch = 0; batch < 10; batch++) {
      const page = await readPage(collection, cursor);
      if (page.documents.length > 50 || (page.nextPageToken && page.nextPageToken === cursor)) throw new Error('Invalid retention page.');
      for (const document of page.documents) {
        const id = document.name.slice(prefix.length);
        if (!document.name.startsWith(prefix) || !id || id.includes('/') || !document.updateTime) {
          throw new Error('Unexpected retention document or missing concurrency version.');
        }
        const fields = flattenFirestoreDocument(document);
        const classification = classifyRetention(collection, fields, now, policy);
        const disposition = classification === 'preserve-suppression' && !prepareSuppression(id, fields)
          ? 'needs-review' : classification;
        summary.examined++;
        summary.dispositions[disposition] = (summary.dispositions[disposition] ?? 0) + 1;
        hash.update(JSON.stringify([document.name, document.updateTime, disposition]));
      }
      cursor = page.nextPageToken;
      if (!cursor) break;
    }
    summary.truncated = Boolean(cursor);
  }
  return {
    action: 'RETENTION_DRY_RUN', runId: randomUUID(), projectId, databaseId, cutoffAt: new Date(now).toISOString(),
    policy, counts, snapshotDigest: hash.digest('hex'), writes: 0,
  };
}
