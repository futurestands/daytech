import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from './app';
import { mintQuotationShareToken } from './lib/quotationTokens';

const secret = Buffer.alloc(32, 42).toString('hex');
const ref = 'QTE-2026-ABC123';
const app = createApiApp({
  env: { NODE_ENV: 'production', VERCEL: '1', QUOTATION_LINK_SECRET: secret },
  adminAuthDeps: {
    verifyToken: async () => ({ uid: 'staff', emailVerified: true }),
    fetchUser: async () => ({ uid: 'staff', role: 'admin', active: true }),
  },
  verifyClientToken: async (uid) => ({
    uid, emailVerified: true, issuer: 'test', audience: 'test', exp: 100, iat: 1,
  }),
  fetchFirestoreDoc: async (uid, collection) => collection === 'users'
    ? { active: uid !== 'inactive' }
    : { id: ref, quotationNumber: ref, clientUid: 'owner', clientEmail: 'test@example.invalid' },
});

let server: ReturnType<typeof app.listen>;
let origin: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});

function lookup(query: Record<string, string>, uid?: string) {
  return fetch(`${origin}/api/portal/lookup?${new URLSearchParams(query)}`, {
    headers: uid ? { Authorization: `Bearer ${uid}` } : undefined,
  });
}

describe('customer quotation lookup', () => {
  it('requires a session or valid signed link', async () => {
    expect((await lookup({ ref })).status).toBe(401);
  });

  it('verifies ownership and active account state independently of storage', async () => {
    expect((await lookup({ ref }, 'other')).status).toBe(404);
    expect((await lookup({ ref }, 'inactive')).status).toBe(403);
    const response = await lookup({ ref }, 'owner');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).not.toContain('test@example.invalid');
  });

  it('returns a signed quotation before expiry and rejects expired links', async () => {
    const quotation = {
      quotationNumber: ref, title: 'Test quotation', clientOrganisation: 'Example company',
      currency: 'UGX' as const, discountPercent: 0, taxPercent: 18, status: 'Sent' as const,
      validUntil: '2026-12-31', paymentTerms: 'On delivery', notes: '', expiresInDays: 1,
      items: [{ itemType: 'Service' as const, description: 'Sample work', details: '', unit: 'hour',
        quantity: 2, unitPrice: 1000 }],
    };
    const valid = mintQuotationShareToken(quotation, { secret });
    const response = await lookup({ token: valid.token });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ referenceNumber: ref, totalAmount: 2360 });
    const expired = mintQuotationShareToken(quotation, { secret, nowSeconds: 1 });
    expect((await lookup({ token: expired.token })).status).toBe(401);
  });
});

describe('functional integration', () => {
  it.each(['/api/contact', '/api/demos', '/api/enquiries'])(
    'rejects unavailable persistence on %s without a success response',
    async (path) => {
      const response = await fetch(origin + path, { method: 'POST' });
      expect(response.status).toBe(503);
      expect(await response.json()).not.toHaveProperty('referenceNumber');
    }
  );

  it('distinguishes unavailable server overview from actual zero counts', async () => {
    const response = await fetch(origin + '/api/admin/overview', {
      headers: { Authorization: 'Bearer staff' },
    });
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty('stats');
  });

  it('recomputes UGX totals with discount before VAT and rejects mismatches', async () => {
    const payload = {
      clientName: 'Test Customer', clientOrganisation: 'Example Company',
      clientEmail: 'customer@example.invalid', title: 'Test quotation', currency: 'UGX',
      discountPercent: 10, taxPercent: 18, validUntil: '2027-01-01',
      paymentTerms: 'On delivery',
      items: [{ itemType: 'Service', description: 'Sample work', unit: 'hour', quantity: 2, unitPrice: 100000 }],
    };
    async function validate(totalAmount: number) {
      return fetch(origin + '/api/quotations/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, totalAmount }),
      });
    }
    const valid = await validate(212400);
    expect(valid.status).toBe(200);
    expect(await valid.json()).toMatchObject({
      computed: { subtotal: 200000, discountAmount: 20000, taxAmount: 32400, totalAmount: 212400 },
    });
    expect((await validate(200000)).status).toBe(400);
  });
});

it('exposes Vercel rewrite targets for sitemap and robots', async () => {
  const [robots, sitemap] = await Promise.all([
    fetch(origin + '/api/robots'),
    fetch(origin + '/api/sitemap'),
  ]);
  expect(robots.status).toBe(200);
  expect(await robots.text()).toContain('Disallow: /admin');
  expect(sitemap.status).toBe(200);
  expect(sitemap.headers.get('content-type')).toContain('xml');
  expect(await sitemap.text()).toContain('<urlset');
});
