import { isIP } from 'node:net';
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
const transitions: Record<string, readonly string[]> = {
  New: ['Qualified', 'Follow-up', 'Rejected', 'Opted out'],
  Qualified: ['Follow-up', 'Pilot invited', 'Converted', 'Approved', 'Rejected', 'Opted out'],
  'Follow-up': ['Qualified', 'Pilot invited', 'Converted', 'Approved', 'Rejected', 'Opted out'],
  'Pilot invited': ['Follow-up', 'Converted', 'Rejected', 'Opted out'],
  Converted: ['Opted out'],
  Approved: ['Converted', 'Opted out'],
  Rejected: ['Opted out'],
  'Opted out': [],
};
const salesRoles = ['super_admin', 'admin', 'sales_officer'] as const;

export function registerGrowthRoutes(app: Express, env: NodeJS.ProcessEnv, guard: (roles: readonly string[]) => RequestHandler) {
  const store = createFirestoreStore(env);
  const exhausted = new Set<string>();
  let cachedWindow = -1;
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
    const source = env.VERCEL === '1' ? req.get('x-vercel-forwarded-for') : req.ip;
    if (!source || !isIP(source)) return res.status(503).json({ error: 'Registration is temporarily unavailable.' });
    const window = Math.floor(Date.now() / 900000);
    const ratePath = 'growthRateLimits/' + hash([source, window]);
    if (window !== cachedWindow) { exhausted.clear(); cachedWindow = window; }
    const rejected = () => {
      res.set('Retry-After', String(Math.max(1, Math.ceil(((window + 1) * 900000 - Date.now()) / 1000))));
      return res.status(429).json({ error: 'Too many registrations. Please try again later.' });
    };
    if (exhausted.has(ratePath)) return rejected();
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const rate = await store.get(ratePath);
        const count = rate ? Number(flattenFirestoreDocument(rate).count) : 0;
        if (count >= 8) {
          if (exhausted.size < 1000 && cachedWindow === window) exhausted.add(ratePath);
          return rejected();
        }
        try {
          const quota = store.put(ratePath, { count: count + 1 }, rate ? { updateTime: rate.updateTime } : { exists: false }, ['updatedAt']);
          if ('update' in quota) quota.update.fields.expiresAt = { timestampValue: new Date((window + 2) * 900000).toISOString() };
          await store.commit([quota]);
          break;
        } catch (error) {
          if (!conflict(error) || attempt === 7) throw error;
        }
      }
      if (await store.get(recordPath)) return res.json({ received: true });
      try {
        await store.commit([store.put(recordPath, { ...parsed.data, kind, status: 'New', assignedTo: '', notes: '' }, { exists: false }, ['createdAt', 'updatedAt'])]);
        return res.status(201).json({ received: true });
      } catch (error) {
        if (conflict(error) && await store.get(recordPath)) return res.json({ received: true });
        throw error;
      }
    } catch {
      // Return a generic error without exposing credentials or contact details.
    }
    return res.status(503).json({ error: 'Unable to confirm registration. Please retry.' });
  });

  const filterSchema = z.object({
    product: z.string().max(40).optional(),
    from: z.iso.date().optional(),
    cursorDate: z.iso.datetime().optional(),
    cursorId: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  }).refine(value => Boolean(value.cursorDate) === Boolean(value.cursorId));
  async function rowsFor(req: Request, auth: AdminAuthResult, size: number) {
    const filter = filterSchema.parse(req.query);
    const fields: object[] = [];
    const condition = (fieldPath: string, op: string, value: object) => ({ fieldFilter: { field: { fieldPath }, op, value } });
    if (auth.role === 'sales_officer') fields.push(condition('assignedTo', 'EQUAL', { stringValue: auth.uid }));
    if (filter.product) {
      const field = filter.product === 'partner' ? 'kind' : 'product';
      fields.push(condition(field, 'EQUAL', { stringValue: filter.product }));
    }
    if (filter.from) fields.push(condition('createdAt', 'GREATER_THAN_OR_EQUAL', { timestampValue: filter.from + 'T00:00:00Z' }));
    const cursor = filter.cursorDate && filter.cursorId ? { createdAt: filter.cursorDate, id: filter.cursorId } : undefined;
    const docs = await store.query('growthLeads', fields, size, cursor);
    return docs.map(document => ({ ...flattenFirestoreDocument(document), version: document.updateTime }));
  }

  app.get('/api/admin/growth', guard(salesRoles), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const auth = context(req);
    if (!auth?.uid) return res.sendStatus(403);
    try {
      const rows = await rowsFor(req, auth, 51);
      return res.json({ rows: rows.slice(0, 50), more: rows.length > 50 });
    } catch (error) { return res.sendStatus(error instanceof z.ZodError ? 400 : 503); }
  });

  app.get('/api/admin/growth/analytics', guard(['super_admin', 'admin']), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!context(req)?.uid) return res.sendStatus(403);
    const filter = z.object({ from: z.iso.date(), product: z.string().max(40).optional() }).safeParse(req.query);
    if (!filter.success) return res.sendStatus(400);
    const since = Date.parse(filter.data.from + 'T00:00:00Z');
    if (since > Date.now() || since < Date.now() - 366 * 86_400_000) return res.sendStatus(400);
    const eq = (fieldPath: string, value: string) => ({ fieldFilter: { field: { fieldPath }, op: 'EQUAL', value: { stringValue: value } } });
    const dates = [{ fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: new Date(since).toISOString() } } }];
    const product = filter.data.product;
    const interest = [eq('kind', 'interest'), ...dates, ...(product ? [eq('product', product)] : [])];
    try {
      const [registrations, qualified, pilots, converted, optedOut, partners, demos] = await Promise.all([
        store.count('growthLeads', interest),
        store.count('growthLeads', [...interest, eq('status', 'Qualified')]),
        store.count('growthLeads', [...interest, eq('status', 'Pilot invited')]),
        store.count('growthLeads', [...interest, eq('status', 'Converted')]),
        store.count('growthLeads', [...interest, eq('status', 'Opted out')]),
        store.count('growthLeads', [...dates, eq('kind', 'partner')]),
        store.count('demoBookings', [...dates, ...(product ? [eq('productSlug', product)] : [])]),
      ]);
      return res.json({ from: filter.data.from, registrations, qualified, pilots, converted, optedOut, partners, demos,
        conversionRate: registrations ? converted / registrations : null });
    } catch { return res.sendStatus(503); }
  });

  app.get('/api/admin/growth/export', guard(['super_admin', 'admin']), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const auth = context(req);
    if (!auth?.uid) return res.sendStatus(403);
    try {
      const rows = await rowsFor(req, auth, 51);
      const headers = ['name', 'organisation', 'email', 'product', 'status', 'createdAt'];
      const csv = [headers.join(','), ...rows.slice(0, 50).map(row =>
        headers.map(key => safeCsvCell((row as Record<string, unknown>)[key])).join(','))].join('\r\n');
      await store.commit([store.put('auditLogs/' + randomUUID(), {
        actorUid: auth.uid, actorEmail: '', action: 'GROWTH_EXPORT', target: 'growthLeads',
        exportedRows: Math.min(rows.length, 50),
      }, { exists: false }, ['createdAt'])]);
      res.attachment('daytech-registrations.csv').type('text/csv');
      return res.send(csv);
    } catch (error) { return res.sendStatus(error instanceof z.ZodError ? 400 : 503); }
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
      if (actor.role === 'sales_officer' && (current.assignedTo !== actor.uid || updates.assignedTo !== actor.uid)) return res.sendStatus(404);
      if (document.updateTime !== version || (current.status === 'Opted out' && updates.status !== 'Opted out')) {
        return res.status(409).json({ error: 'This registration has changed or opted out.' });
      }
      if (updates.status !== current.status && !transitions[String(current.status)]?.includes(updates.status)) {
        return res.status(409).json({ error: 'That status transition is not allowed.' });
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

export function safeCsvCell(value: unknown) {
  const text = String(value ?? '');
  const prefix = /^[\s=+\-@\uFEFF]/u.test(text) ? "'" : '';
  return '"' + prefix + text.replaceAll('"', '""') + '"';
}
