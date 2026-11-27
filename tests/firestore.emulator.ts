import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run with a local Firestore emulator.');
  env = await initializeTestEnvironment({
    projectId: 'demo-daytech-milestone',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  await env.clearFirestore();
});

afterAll(async () => { await env?.cleanup(); });

function profile(uid: string, role: string, active = true) {
  return { uid, role, active, displayName: 'Test account', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}

function caller(uid: string) {
  return env.authenticatedContext(uid, { email_verified: true }).firestore();
}

describe('Firestore authorisation', () => {
  it('limits self-registration to an active client profile', async () => {
    const db = caller('new-client');
    const ref = doc(db, 'users/new-client');
    await assertFails(setDoc(ref, profile('new-client', 'super_admin')));
    await assertSucceeds(setDoc(ref, profile('new-client', 'client')));
    await assertFails(updateDoc(ref, { role: 'super_admin', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { displayName: 'Updated name', updatedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(db, 'system/bootstrap')));
  });

  it.each([
    ['super_admin', true], ['admin', true], ['sales_officer', true],
    ['content_manager', false], ['project_manager', false], ['support_officer', false],
    ['client', false],
  ])('enforces cross-customer quotation reads for %s', async (role, canRead) => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users', role), profile(role, role));
      await setDoc(doc(db, 'quotations', 'customer-quote'), { clientUid: 'owner-client' });
    });
    const read = getDoc(doc(caller(role), 'quotations/customer-quote'));
    await (canRead ? assertSucceeds(read) : assertFails(read));
  });

  it('permits only the active owner among customers', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users/active-owner'), profile('active-owner', 'client'));
      await setDoc(doc(db, 'users/inactive-owner'), profile('inactive-owner', 'client', false));
      await setDoc(doc(db, 'quotations/active-quote'), { clientUid: 'active-owner' });
      await setDoc(doc(db, 'quotations/inactive-quote'), { clientUid: 'inactive-owner' });
    });
    await assertSucceeds(getDoc(doc(caller('active-owner'), 'quotations/active-quote')));
    await assertFails(getDoc(doc(caller('active-owner'), 'quotations/inactive-quote')));
    await assertFails(getDoc(doc(caller('inactive-owner'), 'quotations/inactive-quote')));
  });
});

describe('quotation lifecycle and ownership', () => {
  it.each(['Accepted', 'Declined'])('allows the assigned customer to mark a sent quotation %s', async (decision) => {
    const id = decision === 'Accepted' ? 'QTE-2026-TEST01' : 'QTE-2026-TEST02';
    const path = 'quotations/' + id;
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users/decision-owner'), profile('decision-owner', 'client'));
      await setDoc(doc(db, 'users/decision-other'), profile('decision-other', 'client'));
      await setDoc(doc(db, path), {
        quotationNumber: id, clientUid: 'decision-owner', clientName: 'Test Customer',
        clientOrganisation: 'Test Organisation', clientEmail: 'customer@example.invalid',
        title: 'Service quotation', currency: 'UGX', subtotal: 100000, discountPercent: 0,
        discountAmount: 0, taxPercent: 18, taxAmount: 18000, totalAmount: 118000,
        status: 'Sent', validUntil: '2027-01-01', paymentTerms: 'On delivery',
        preparedByName: 'Test Staff', preparedByEmail: 'staff@example.invalid', createdByUid: 'sales',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    });
    const patch = { status: decision, updatedAt: serverTimestamp() };
    const quote = doc(caller('decision-owner'), path);
    await assertFails(updateDoc(doc(caller('decision-other'), path), patch));
    await assertFails(updateDoc(quote, { ...patch, totalAmount: 1 }));
    await assertSucceeds(updateDoc(quote, patch));
    await assertFails(updateDoc(quote, { status: 'Sent', updatedAt: serverTimestamp() }));
  });
});

describe('acquisition persistence', () => {
  it('stores guest submissions under their reference and denies customer self-claims', async () => {
    const id = 'DTQ-2026-GUEST1';
    const path = 'enquiries/' + id;
    const guest = env.unauthenticatedContext().firestore();
    const timestamps = { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const enquiry = {
      referenceNumber: id, status: 'New', fullName: 'Guest Customer', organisation: 'Test Company',
      email: 'guest@example.invalid', telephone: '0700000000', country: 'Uganda', industry: 'General',
      requiredService: 'Consulting', interestedProduct: 'None', projectDescription: 'Sample project description',
      budgetRange: 'Undecided', currency: 'UGX', timeline: 'Next month', preferredContactMethod: 'Email',
      consentAccepted: true, ...timestamps,
    };
    await assertSucceeds(setDoc(doc(guest, path), enquiry));
    await assertFails(setDoc(doc(guest, path), enquiry));
    await assertFails(setDoc(doc(guest, 'enquiries/another-document'), enquiry));
    const customer = caller('registered-guest');
    await assertSucceeds(setDoc(doc(customer, 'users/registered-guest'), profile('registered-guest', 'client')));
    await assertFails(getDoc(doc(customer, path)));
    await assertFails(updateDoc(doc(customer, path), { submitterUid: 'registered-guest', updatedAt: serverTimestamp() }));
    await env.withSecurityRulesDisabled(async ctx => {
      const read = await getDoc(doc(ctx.firestore(), path));
      if (!read.exists() || read.data()?.referenceNumber !== id) throw new Error('Enquiry was not persisted.');
    });
  });
});

describe('guest contact and demo persistence', () => {
  it('allows validated creates but prevents guest reads and overwrites', async () => {
    const guest = env.unauthenticatedContext().firestore();
    const contact = {
      referenceNumber: 'DTC-2026-PERSST', fullName: 'Test Customer', email: 'customer@example.invalid',
      subject: 'Help with integration', message: 'Please contact us about integration.', createdAt: serverTimestamp(),
    };
    const demo = {
      referenceNumber: 'DTD-2026-PERSST', status: 'Pending', productSlug: 'daytech-hr',
      productName: 'DayTech HR', fullName: 'Test Customer', organisation: 'Test Company',
      email: 'customer@example.invalid', telephone: '0700000000', preferredDate: '2027-01-01',
      preferredTime: '11:00', timezone: 'Africa/Kampala', organisationSize: '10–49',
      requirements: 'We need a product walkthrough.', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    for (const [collectionPath, data] of [['contactMessages', contact], ['demoBookings', demo]] as const) {
      const path = collectionPath + '/' + data.referenceNumber;
      const reference = doc(guest, path);
      await assertSucceeds(setDoc(reference, data));
      await assertFails(getDoc(reference));
      await assertFails(setDoc(reference, data));
      await env.withSecurityRulesDisabled(async ctx => {
        const persisted = await getDoc(doc(ctx.firestore(), path));
        if (persisted.data()?.referenceNumber !== data.referenceNumber) throw new Error('Record was not persisted.');
      });
    }
  });
});

describe('trusted quotation API with Firestore persistence', () => {
  it('commits authoritative totals once, protects revisions and serves revocable links', async () => {
    const { createApiApp } = await import('../server/app');
    const { randomUUID } = await import('node:crypto');
    const verifyToken = async (uid: string) => ({ uid, emailVerified: true });
    const app = createApiApp({
      env: { NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST },
      adminAuthDeps: {
        verifyToken,
        fetchUser: async (_token, uid) => ({ uid, role: uid === 'test-sales' ? 'sales_officer' : uid === 'test-admin' ? 'admin' : 'client', active: uid !== 'disabled' }),
      },
      verifyClientToken: async uid => ({ ...await verifyToken(uid), issuer: 'test', audience: 'test', exp: 100, iat: 1 }),
      fetchFirestoreDoc: async uid => ({ active: uid !== 'disabled' }),
    });
    await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users/test-sales'), profile('test-sales', 'sales_officer'));
      await setDoc(doc(db, 'users/client-owner'), profile('client-owner', 'client'));
      await setDoc(doc(db, 'users/client-owner/private/info'), { uid: 'client-owner', email: 'customer@example.invalid', emailVerified: true });
      await setDoc(doc(db, 'enquiries/DTQ-2026-GUEST1'), { status: 'New', email: 'customer@example.invalid' });
    });
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const started = app.listen(0, '127.0.0.1', () => resolve(started));
    });
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing test address.');
      const origin = `http://127.0.0.1:${address.port}`;
      const request = (path: string, body?: object, uid = 'test-sales', method = 'POST', key = randomUUID()) =>
        fetch(origin + path, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + uid, 'Idempotency-Key': key },
          body: body && JSON.stringify(body),
        });
      const quote = {
        clientUid: 'client-owner', clientName: 'Test Customer', clientOrganisation: 'Test Organisation',
        clientEmail: 'customer@example.invalid', title: 'Service quotation', currency: 'UGX',
        discountPercent: 10, taxPercent: 18, status: 'Sent', validUntil: '2099-12-31',
        paymentTerms: 'On delivery', totalAmount: 1,
        items: [{ itemType: 'Service', description: 'Test service', unit: 'hour', quantity: 2, unitPrice: 100000 }],
      };
      const endpoint = '/api/admin/quotations';
      const link = '/api/admin/enquiries/DTQ-2026-GUEST1/link-customer';
      expect((await request(link, { clientUid: 'client-owner', verifiedOriginalContact: true }, 'unprivileged')).status).toBe(403);
      expect((await request(link, { clientUid: 'client-owner', verifiedOriginalContact: true })).status).toBe(204);
      Object.assign(quote, { enquiryId: 'DTQ-2026-GUEST1' });
      const key = randomUUID();
      const responses = await Promise.all([
        request(endpoint, quote, 'test-sales', 'POST', key),
        request(endpoint, quote, 'test-sales', 'POST', key),
      ]);
      for (const response of responses) expect(response.status).toBe(201);
      const [first, second] = await Promise.all(responses.map(response => response.json()));
      expect(first).toEqual(second);
      expect(first).toMatchObject({ revision: 1, totalAmount: 212400 });
      const number = first.quotationNumber;
      const path = 'quotations/' + number;

      const browser = caller('test-sales');
      await assertFails(setDoc(doc(browser, 'quotations/QTE-2026-BYPASS'), quote));
      await assertFails(updateDoc(doc(browser, path), { totalAmount: 1, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(doc(browser, path + '/items/r1-1'), { unitPrice: 1 }));
      await assertFails(updateDoc(doc(browser, path + '/revisions/1'), { totalAmount: 1 }));
      expect((await request(endpoint, { ...quote, title: 'Conflicting request' }, 'test-sales', 'POST', key)).status).toBe(409);
      expect((await request(endpoint, quote, 'unprivileged')).status).toBe(403);

      const shareEndpoint = endpoint + '/share-link';
      const issued = await request(shareEndpoint, { quotationNumber: number, revision: 1 });
      expect(issued.status).toBe(201);
      const share = await issued.json();
      const token = share.relativeUrl.split('#quote=')[1];
      const readShare = (value: string) => request('/api/portal/quotation-share', { token: value }, '');
      const shared = await readShare(token);
      expect(shared.status).toBe(200);
      expect(await shared.json()).toMatchObject({ totalAmount: 212400, quotation: { items: [{ lineTotal: 200000 }] } });
      const expiring = await (await request(shareEndpoint, { quotationNumber: number, revision: 1 })).json();
      await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'quotationShares/' + expiring.linkId), {
        expiresAt: '2026-01-01T00:00:00.000Z',
      }));
      expect((await readShare(expiring.relativeUrl.split('#quote=')[1])).status).toBe(404);
      expect((await request(shareEndpoint + '/' + share.linkId, undefined, 'test-sales', 'DELETE')).status).toBe(204);
      expect((await readShare(token)).status).toBe(404);

      const amended = await request(endpoint, { ...quote, quotationNumber: number, expectedRevision: 1, taxPercent: 0 });
      expect(amended.status).toBe(200);
      expect(await amended.json()).toMatchObject({ revision: 2, totalAmount: 180000 });
      const prior = await assertSucceeds(getDoc(doc(browser, path + '/revisions/1')));
      expect(prior.data()).toMatchObject({ totalAmount: 212400 });
      const decision = '/api/portal/quotations/' + number + '/decision';
      expect((await request(decision, { revision: 1, status: 'Accepted' }, 'client-owner')).status).toBe(409);
      expect((await request(decision, { revision: 2, status: 'Accepted' }, 'other-customer')).status).toBe(404);
      const decisions = await Promise.all([
        request(decision, { revision: 2, status: 'Accepted' }, 'client-owner'),
        request(decision, { revision: 2, status: 'Accepted' }, 'client-owner'),
      ]);
      expect(decisions.map(response => response.status).sort()).toEqual([200, 409]);
      const projectEndpoint = endpoint + '/' + number + '/project';
      expect((await request(projectEndpoint, { revision: 2 })).status).toBe(403);
      expect((await request(projectEndpoint, { revision: 1 }, 'test-admin')).status).toBe(409);
      for (let i = 0; i < 2; i++) {
        const converted = await request(projectEndpoint, { revision: 2 }, 'test-admin');
        expect(converted.status).toBe(200);
        expect(await converted.json()).toEqual({ projectId: number });
      }
      const project = await assertSucceeds(getDoc(doc(caller('client-owner'), 'projects/' + number)));
      expect(project.data()).toMatchObject({ ownerUid: 'client-owner', stage: 'Discovery' });
      expect((await request(endpoint, { ...quote, quotationNumber: number, expectedRevision: 2 })).status).toBe(409);
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }, 25_000);
});
