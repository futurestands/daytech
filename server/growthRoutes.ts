import { createHmac, randomUUID } from 'node:crypto';
import type { Express, Request, RequestHandler } from 'express';
import { z } from 'zod';
import { getProductBySlug } from '../src/data/products';
import type { AdminAuthResult } from './lib/adminAuth';
import { flattenFirestoreDocument } from './lib/firebaseAuth';
import { createFirestoreStore, FirestoreStoreError } from './lib/firestoreStore';

const field = (max: number) => z.string().trim().min(2).max(max);
const common = z.object({
  name: field(120), organisation: field(150),
  email: z.email().max(160).transform(value => value.toLowerCase()),
  phone: z.string().trim().max(40).default(''), consent: z.literal(true),
});
const interest = common.extend({
  product: field(40), category: field(100), size: z.string().trim().max(50).default(''),
  challenge: field(1500), pilot: z.boolean(),
});
const partner = common.extend({ region: field(120), experience: field(1500), role: field(100) });
const statuses = ['New', 'Qualified', 'Follow-up', 'Pilot invited', 'Converted', 'Opted out', 'Approved', 'Rejected'] as const;
const salesRoles = ['super_admin', 'admin', 'sales_officer'] as const;

export function registerGrowthRoutes(app: Express, env: NodeJS.ProcessEnv, guard: (roles: readonly string[]) => RequestHandler) {
  const store = createFirestoreStore(env);
  const conflict = (error: unknown) => error instanceof FirestoreStoreError &&
    (error.status === 409 || error.status === 412 || error.code === 'FAILED_PRECONDITION');
  const context = (req: Request) => (req as Request & { adminContext?: AdminAuthResult }).adminContext;

  app.post('/api/growth/:kind', async (req, res) => {
    const kind = req.params.kind;
    if (kind !== 'interest' && kind !== 'partner') return res.sendStatus(404);
    const parsed = (kind === 'interest' ? interest : partner).safeParse(req.body);
    if (!parsed.success || ('product' in parsed.data && !getProductBySlug(parsed.data.product))) {
      return res.status(400).json({ error: 'Review the required fields and provide consent before submitting.' });
    }
    const secret = env.GROWTH_HASH_SECRET;
    if (!secret || secret.length < 32) return res.status(503).json({ error: 'Registration is temporarily unavailable.' });
    const hash = (value: unknown) => createHmac('sha256', secret).update(JSON.stringify(value)).digest('hex');
    const recordPath = 'growthLeads/' + hash([kind, parsed.data.email, 'product' in parsed.data ? parsed.data.product : '']);
    const ratePath = 'growthRateLimits/' + hash([env.VERCEL === '1' ? req.get('x-vercel-forwarded-for') || 'unknown' : req.ip, Math.floor(Date.now() / 900000)]);
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const existing = await store.get(recordPath);
        if (existing) return res.json({ received: true });
        const rate = await store.get(ratePath);
        const count = rate ? Number(flattenFirestoreDocument(rate).count) : 0;
        if (count >= 8) {
          res.set('Retry-After', '900');
          return res.status(429).json({ error: 'Too many registrations. Please try again later.' });
        }
        try {
          await store.commit([
            store.put(recordPath, { ...parsed.data, kind, status: 'New', assignedTo: '', notes: '' }, { exists: false }, ['createdAt', 'updatedAt']),
            store.put(ratePath, { count: count + 1 }, rate ? { updateTime: rate.updateTime } : { exists: false }, ['updatedAt']),
          ]);
          return res.status(201).json({ received: true });
        } catch (error) {
          if (!conflict(error)) throw error;
        }
      }
    } catch {
      // Return a generic error without exposing credentials or contact details.
    }
    return res.status(503).json({ error: 'Unable to confirm registration. Please retry.' });
  });

  app.get('/api/admin/growth', guard(salesRoles), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!context(req)?.uid) return res.sendStatus(403);
    try {
      const rows = (await store.list('growthLeads')).map(document => ({ ...flattenFirestoreDocument(document), version: document.updateTime }));
      return res.json({ rows });
    } catch {
      return res.status(503).json({ error: 'Unable to load registrations.' });
    }
  });

  app.patch('/api/admin/growth/:id', guard(salesRoles), async (req, res) => {
    const actor = context(req);
    if (!actor?.uid) return res.sendStatus(403);
    const id = String(req.params.id);
    const parsed = z.object({
      status: z.enum(statuses), assignedTo: z.string().trim().max(128),
      notes: z.string().trim().max(1500), version: z.string().datetime(),
    }).safeParse(req.body);
    if (!/^[a-f0-9]{64}$/.test(id) || !parsed.success) return res.status(400).json({ error: 'Invalid lead update.' });
    try {
      const path = 'growthLeads/' + id;
      const document = await store.get(path);
      if (!document) return res.sendStatus(404);
      const current = flattenFirestoreDocument(document);
      const { version, ...updates } = parsed.data;
      if (document.updateTime !== version || (current.status === 'Opted out' && updates.status !== 'Opted out')) {
        return res.status(409).json({ error: 'This registration has changed or opted out.' });
      }
      if ((['Approved', 'Rejected'].includes(updates.status) && (current.kind !== 'partner' || actor.role === 'sales_officer')) ||
          (updates.status === 'Pilot invited' && current.pilot !== true)) return res.sendStatus(403);
      if (updates.assignedTo) {
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(updates.assignedTo)) return res.sendStatus(400);
        const account = await store.get('users/' + updates.assignedTo);
        const user = account && flattenFirestoreDocument(account);
        if (user?.active !== true || !salesRoles.some(role => role === user.role)) {
          return res.status(400).json({ error: 'Choose an active sales or administration account.' });
        }
      }
      const write = store.put(path, updates, { updateTime: version }, ['updatedAt']);
      if ('update' in write) write.update.fields = { ...document.fields, ...write.update.fields };
      await store.commit([
        write,
        store.put('auditLogs/' + randomUUID(), {
          actorUid: actor.uid, actorEmail: '', action: 'GROWTH_LEAD_UPDATED', target: id, status: updates.status,
        }, { exists: false }, ['createdAt']),
      ]);
      return res.sendStatus(204);
    } catch (error) {
      return res.status(conflict(error) ? 409 : 503).json({ error: 'Unable to save this update. Reload the registration and try again.' });
    }
  });
}
