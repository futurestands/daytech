import { createHash, randomUUID } from 'node:crypto';
import type { Express, Request, RequestHandler } from 'express';
import { z } from 'zod';
import { getProductBySlug, PRODUCTS } from '../src/data/products';
import { PRODUCT_STATUSES } from '../src/types/domain';
import type { AdminAuthResult } from './lib/adminAuth';
import { flattenFirestoreDocument } from './lib/firebaseAuth';
import { createFirestoreStore, FirestoreStoreError, type FirestoreWrite } from './lib/firestoreStore';

const plan = z.object({
  name: z.enum(['Starter', 'Professional', 'Enterprise']),
  cadence: z.enum(['Monthly', 'Annual', 'School term', 'Custom']),
  currency: z.enum(['UGX', 'USD', 'KES']),
  amount: z.number().finite().min(0).max(1e10).nullable(),
  implementationFee: z.number().finite().min(0).max(1e10).optional(),
  optionalServices: z.string().trim().max(300).default(''),
  supportLimits: z.string().trim().max(300).default(''),
  effectiveDate: z.iso.date(),
});
const draftSchema = z.object({
  description: z.string().trim().min(10).max(2000),
  status: z.enum(PRODUCT_STATUSES),
  capabilities: z.array(z.string().trim().min(2).max(180)).max(25),
  releaseVersion: z.string().trim().max(64),
  evidence: z.string().trim().max(2000),
  launchUrl: z.string().trim().max(512).default(''),
  pricing: z.array(plan).max(15),
});
const approvalSchema = z.object({
  approvedOrigin: z.string().trim().max(512).default(''),
  approvePricing: z.boolean(),
});
const versionSchema = z.iso.datetime();
const editors = ['super_admin', 'admin', 'content_manager'] as const;
const publisher = ['super_admin'] as const;
const projectionSchema = draftSchema.pick({ description: true, status: true, capabilities: true, releaseVersion: true, launchUrl: true, pricing: true });
const draftDigest = (draft: z.infer<typeof draftSchema>) =>
  createHash('sha256').update(JSON.stringify(draft)).digest('hex');

function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash ? url : null;
  } catch { return null; }
}

export function registerPublishingRoutes(app: Express, env: NodeJS.ProcessEnv, guard: (roles: readonly string[]) => RequestHandler) {
  const store = createFirestoreStore(env);
  const actor = (req: Request) => (req as Request & { adminContext?: AdminAuthResult }).adminContext;
  const errorStatus = (error: unknown) => error instanceof FirestoreStoreError && (
    [409, 412].includes(error.status) || error.code === 'FAILED_PRECONDITION'
  ) ? 409 : 503;
  const validSlug = (slug: string) => Boolean(getProductBySlug(slug));

  async function loadDraft(stored: Record<string, unknown>) {
    const payload = JSON.parse(String(stored.payload));
    if (typeof stored.proposalId !== 'string') return draftSchema.parse(payload);
    const proposal = await store.get('productPricingProposals/' + stored.proposalId);
    const proposalFields = proposal && flattenFirestoreDocument(proposal);
    return draftSchema.parse({ ...payload, pricing: JSON.parse(String(proposalFields?.plans)) });
  }

  app.get('/api/products/releases', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!env.FIRESTORE_SERVICE_ACCOUNT_JSON && !(env.NODE_ENV === 'test' && env.FIRESTORE_EMULATOR_HOST)) return res.json({});
    const products = req.query.scope === 'featured'
      ? PRODUCTS.filter(product => ['inventory', 'hotelos', 'schools'].includes(product.slug))
      : PRODUCTS;
    try {
      const allowed = new Set(products.map(product => product.slug));
      const records = await store.listPage('productReleases', PRODUCTS.length);
      const entries = records.flatMap(record => {
        const slug = record.name.split('/').at(-1);
        if (!slug || slug === 'waterops' || !allowed.has(slug)) return [];
        const release = projectionSchema.safeParse(JSON.parse(String(flattenFirestoreDocument(record).projection)));
        return release.success ? [[slug, release.data.status]] : [];
      });
      return res.json(Object.fromEntries(entries));
    } catch { return res.sendStatus(503); }
  });

  app.get('/api/products/:slug/release', async (req, res) => {
    const slug = req.params.slug;
    res.set('Cache-Control', 'no-store');
    if (!validSlug(slug)) return res.sendStatus(404);
    try {
      const document = await store.get('productReleases/' + slug);
      if (!document) return res.sendStatus(404);
      const fields = flattenFirestoreDocument(document);
      const output = projectionSchema.parse(JSON.parse(String(fields.projection)));
      return res.json({ ...output, publishedAt: fields.publishedAt });
    } catch { return res.sendStatus(503); }
  });

  app.get('/api/admin/product-drafts/:slug', guard(editors), async (req, res) => {
    const slug = String(req.params.slug);
    res.set('Cache-Control', 'no-store');
    if (!actor(req)?.uid) return res.sendStatus(403);
    if (!validSlug(slug)) return res.sendStatus(404);
    try {
      const document = await store.get('productDrafts/' + slug);
      if (!document) return res.json({ draft: null });
      const fields = flattenFirestoreDocument(document);
      return res.json({ draft: await loadDraft(fields), phase: fields.phase, version: document.updateTime });
    } catch { return res.sendStatus(503); }
  });

  app.get('/api/admin/product-revisions/:slug/:revisionId', guard(editors), async (req, res) => {
    const { slug, revisionId } = req.params;
    res.set('Cache-Control', 'no-store');
    if (!actor(req)?.uid) return res.sendStatus(403);
    if (!validSlug(slug) || !/^(current|legacy|[\da-f-]{36})$/.test(revisionId)) return res.sendStatus(404);
    try {
      const path = 'productReleases/' + slug;
      const document = await store.get(revisionId === 'current' ? path : path + '/revisions/' + revisionId);
      if (!document) return res.sendStatus(404);
      const fields = flattenFirestoreDocument(document);
      return res.json({
        revisionId: fields.revisionId ?? 'legacy',
        previousRevisionId: fields.previousRevisionId ?? '',
        publishedAt: fields.publishedAt,
        projection: projectionSchema.parse(JSON.parse(String(fields.projection))),
      });
    } catch { return res.sendStatus(503); }
  });

  app.put('/api/admin/product-drafts/:slug', guard(editors), async (req, res) => {
    const auth = actor(req);
    const slug = String(req.params.slug);
    const parsed = z.object({ draft: draftSchema, version: versionSchema.nullable() }).safeParse(req.body);
    if (!auth?.uid) return res.sendStatus(403);
    if (!validSlug(slug)) return res.sendStatus(404);
    if (!parsed.success) return res.status(400).json({ error: 'Check draft fields, pricing and revision.' });
    const { draft, version } = parsed.data;
    if (slug === 'waterops' && (draft.pricing.length || ['Private Alpha', 'Public Beta', 'Available'].includes(draft.status))) {
      return res.status(400).json({ error: 'WaterOps remains restricted pending documented IP clearance.' });
    }
    if (draft.launchUrl && (!httpsUrl(draft.launchUrl) || draft.status !== 'Available' || slug === 'waterops')) {
      return res.status(400).json({ error: 'A launch destination is allowed only for an available, unrestricted product.' });
    }
    try {
      const { pricing, ...payload } = draft;
      const proposalId = randomUUID();
      await store.commit([
        store.put('productDrafts/' + slug, {
          payload: JSON.stringify(payload), proposalId, phase: 'Draft', editedBy: auth.uid,
        }, version ? { updateTime: version } : { exists: false }, ['updatedAt']),
        store.put('productPricingProposals/' + proposalId, {
          slug, plans: JSON.stringify(pricing), submittedBy: auth.uid,
        }, { exists: false }, ['createdAt']),
      ]);
      return res.sendStatus(204);
    } catch (error) { return res.sendStatus(errorStatus(error)); }
  });

  app.post('/api/admin/product-drafts/:slug/:action', async (req, res, next) => {
    const action = req.params.action;
    if (!['review', 'approve', 'publish'].includes(action)) return res.sendStatus(404);
    return guard(action === 'review' ? editors : publisher)(req, res, next);
  }, async (req, res) => {
    const auth = actor(req);
    const { slug, action } = req.params;
    const version = versionSchema.safeParse(req.body?.version);
    if (!auth?.uid) return res.sendStatus(403);
    if (!validSlug(slug)) return res.sendStatus(404);
    if (!version.success) return res.sendStatus(400);
    const path = 'productDrafts/' + slug;
    try {
      const document = await store.get(path);
      if (!document) return res.sendStatus(404);
      const stored = flattenFirestoreDocument(document);
      const phases = { review: ['Draft', 'Review'], approve: ['Review', 'Approved'], publish: ['Approved', 'Published'] } as const;
      const [expected, phase] = phases[action as keyof typeof phases];
      if (document.updateTime !== version.data || stored.phase !== expected) {
        return res.status(409).json({ error: 'The draft changed or is in a different stage.' });
      }

      const draft = await loadDraft(stored);
      const next = store.put(path, { phase, actedBy: auth.uid }, { updateTime: document.updateTime }, ['updatedAt']);
      if (!('update' in next)) throw new Error('Expected an update.');
      next.update.fields = { ...document.fields, ...next.update.fields };
      const writes: FirestoreWrite[] = [next];
      const audit: Record<string, string> = {
        actorUid: auth.uid, actorEmail: '', action: 'PRODUCT_' + action.toUpperCase(), target: slug,
      };
      if (action === 'approve') {
        const approval = approvalSchema.safeParse(req.body?.approval);
        if (!approval.success) return res.status(400).json({ error: 'Provide the approval details.' });
        const { approvedOrigin, approvePricing } = approval.data;
        const url = httpsUrl(draft.launchUrl);
        if ((draft.pricing.length && !approvePricing) || (draft.status === 'Available' && (
          slug === 'waterops' || !url || url.origin !== approvedOrigin || !draft.releaseVersion || !draft.evidence || !draft.capabilities.length
        ))) return res.status(400).json({ error: 'Availability needs release evidence, verified capabilities and an approved HTTPS origin. Proposed prices need explicit approval.' });
        const approvalId = randomUUID();
        next.update.fields.approvalId = { stringValue: approvalId };
        next.update.fields.reviewedVersion = { stringValue: document.updateTime };
        const binding = { slug, approvedBy: auth.uid, draftDigest: draftDigest(draft), reviewedVersion: document.updateTime };
        for (const [collection, fields] of [
          ['productReleaseEvidence', { evidence: draft.evidence, releaseVersion: draft.releaseVersion }],
          ['productApprovedOrigins', { origin: approvedOrigin }],
          ['productApprovedPricing', { plans: JSON.stringify(draft.pricing), approvePricing }],
        ] as const) {
          writes.push(store.put(collection + '/' + approvalId, { ...fields, ...binding }, { exists: false }, ['createdAt']));
        }
      } else if (action === 'publish') {
        if (typeof stored.approvalId !== 'string' || !/^[\da-f-]{36}$/.test(stored.approvalId)) return res.sendStatus(409);
        const approvals = await Promise.all(['productReleaseEvidence', 'productApprovedOrigins', 'productApprovedPricing']
          .map(collection => store.get(collection + '/' + stored.approvalId)));
        const digest = draftDigest(draft);
        const [evidence, origin, pricing] = approvals.map(item => item && flattenFirestoreDocument(item));
        const approved = [evidence, origin, pricing].every(record =>
          record && record.slug === slug && record.draftDigest === digest &&
          typeof stored.actedBy === 'string' && record.approvedBy === stored.actedBy &&
          typeof stored.reviewedVersion === 'string' && record.reviewedVersion === stored.reviewedVersion);
        if (!approved || evidence?.evidence !== draft.evidence || evidence?.releaseVersion !== draft.releaseVersion ||
          pricing?.plans !== JSON.stringify(draft.pricing) || (draft.pricing.length && pricing.approvePricing !== true) ||
          (draft.status === 'Available' && (slug === 'waterops' || !draft.evidence || !draft.releaseVersion ||
            !draft.capabilities.length || !httpsUrl(draft.launchUrl) || httpsUrl(draft.launchUrl)?.origin !== origin?.origin))) {
          return res.status(409).json({ error: 'Release approval is incomplete or stale. Review and approve the draft again.' });
        }
        audit.approvalId = stored.approvalId;
        audit.approvedBy = String(stored.actedBy);
        const releasePath = 'productReleases/' + slug;
        const revisionPath = releasePath + '/revisions/' + stored.approvalId;
        const previous = await store.get(releasePath);
        const previousFields = previous && flattenFirestoreDocument(previous);
        if (previousFields && typeof previousFields.revisionId !== 'string') {
          // Archive the last pre-history release before replacing it.
          const archive = store.put(releasePath + '/revisions/legacy', {}, { exists: false });
          if (previous && 'update' in archive) archive.update.fields = previous.fields;
          writes.push(archive);
        }
        const projection = projectionSchema.parse(draft);
        if (projection.status !== 'Available') projection.launchUrl = '';
        const record = {
          projection: JSON.stringify(projection), approvalId: stored.approvalId, publishedBy: auth.uid,
          revisionId: stored.approvalId, previousRevisionId: String(previousFields?.revisionId ?? (previous ? 'legacy' : '')),
        };
        writes.push(
          store.put(revisionPath, record, { exists: false }, ['publishedAt']),
          store.put(releasePath, record, previous ? { updateTime: previous.updateTime } : { exists: false }, ['publishedAt']),
        );
        audit.revisionId = stored.approvalId;
      }
      writes.push(store.put('auditLogs/' + randomUUID(), audit, { exists: false }, ['createdAt']));
      await store.commit(writes);
      return res.sendStatus(204);
    } catch (error) { return res.sendStatus(errorStatus(error)); }
  });
}
