import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from './app';
import { mintQuotationShareToken } from './lib/quotationTokens';

const secret = Buffer.alloc(32, 42).toString('hex');
const ref = 'QTE-2026-ABC123';
const app = createApiApp({
  env: { NODE_ENV: 'production', QUOTATION_LINK_SECRET: secret },
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
