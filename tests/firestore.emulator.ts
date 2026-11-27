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
}, 30_000);

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

describe('dedicated growth intake', () => {
  it('persists one private record across concurrent retries and restricts staff review', async () => {
    const { createApiApp } = await import('../server/app');
    const app = createApiApp({
      env: { NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST, GROWTH_HASH_SECRET: 'test-only-key-not-used-outside-the-emulator' },
      adminAuthDeps: {
        verifyToken: async uid => ({ uid, emailVerified: true }),
        fetchUser: async (_token, uid) => ({ uid, role: ['admin', 'sales_officer', 'super_admin', 'content_manager'].includes(uid) ? uid : 'client', active: true }),
      },
    });
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing test address.');
      const origin = 'http://127.0.0.1:' + address.port;
      const application = { name: 'Example Applicant', organisation: 'Example School', email: 'school@example.invalid', category: 'Education',
        product: 'schools', challenge: 'Consolidate fee records.', pilot: true, consent: true };
      const submit = (body: object) => fetch(origin + '/api/growth/interest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      expect((await submit({ ...application, consent: false })).status).toBe(400);
      const responses = await Promise.all([submit(application), submit(application), submit(application)]);
      expect(responses.map(result => result.status).sort()).toEqual([200, 200, 201]);
      expect((await fetch(origin + '/api/admin/growth')).status).toBe(401);
      expect((await fetch(origin + '/api/admin/growth', { headers: { Authorization: 'Bearer client' } })).status).toBe(403);
      const headers = { Authorization: 'Bearer admin', 'Content-Type': 'application/json' };
      const response = await fetch(origin + '/api/admin/growth', { headers });
      expect(response.status).toBe(200);
      const { rows } = await response.json();
      expect(rows).toHaveLength(1);
      const row = rows[0];
      await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'growthLeads', row.id)));
      await assertFails(getDoc(doc(caller('admin'), 'growthLeads', row.id)));
      const update = () => fetch(origin + '/api/admin/growth/' + row.id, {
        method: 'PATCH', headers, body: JSON.stringify({ version: row.version, status: 'Qualified', notes: 'Verified test lead', assignedTo: '' }),
      });
      expect((await update()).status).toBe(204);
      expect((await update()).status).toBe(409);
      const sales = { Authorization: 'Bearer sales_officer', 'Content-Type': 'application/json' };
      const scoped = await fetch(origin + '/api/admin/growth', { headers: sales });
      expect(scoped.status).toBe(200);
      expect((await scoped.json()).rows).toEqual([]);
      expect((await fetch(origin + '/api/admin/growth/export', { headers: sales })).status).toBe(403);
      expect((await fetch(origin + '/api/admin/growth/export', { headers })).status).toBe(200);
      expect((await fetch(origin + '/api/admin/growth/' + row.id, {
        method: 'PATCH', headers: sales, body: JSON.stringify({ version: row.version, status: 'Qualified', notes: '', assignedTo: 'sales_officer' }),
      })).status).toBe(404);
      const newRow = (await (await fetch(origin + '/api/admin/growth', { headers })).json()).rows[0];
      const patchStatus = (version: string, status: string) => fetch(origin + '/api/admin/growth/' + row.id, {
        method: 'PATCH', headers, body: JSON.stringify({ version, status, notes: '', assignedTo: '' }),
      });
      expect((await patchStatus(newRow.version, 'Opted out')).status).toBe(204);
      const opted = (await (await fetch(origin + '/api/admin/growth', { headers })).json()).rows[0];
      expect((await patchStatus(opted.version, 'Qualified')).status).toBe(409);
      const from = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const analytics = await fetch(origin + '/api/admin/growth/analytics?from=' + from + '&product=schools', { headers });
      expect(analytics.status).toBe(200);
      expect(await analytics.json()).toMatchObject({ registrations: 1, optedOut: 1, conversionRate: 0 });


    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }, 25_000);
});


describe('protected publishing', () => {
  it('guards evidence and pricing and atomically publishes one approved projection', async () => {
    const { createApiApp } = await import('../server/app');
    const app = createApiApp({
      env: { NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST },
      adminAuthDeps: {
        verifyToken: async uid => ({ uid, emailVerified: true }),
        fetchUser: async (_token, uid) => ({ uid, role: uid, active: true }),
      },
    });
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing test address.');
      const origin = 'http://127.0.0.1:' + address.port;
      const req = (route: string, user?: string, method = 'GET', body?: object) => fetch(origin + route, {
        method, headers: { 'Content-Type': 'application/json', ...(user && { Authorization: 'Bearer ' + user }) },
        body: body && JSON.stringify(body),
      });
      const path = '/api/admin/product-drafts/inventory';
      const read = async () => (await req(path, 'content_manager')).json();
      const draft = {
        description: 'Verified product release testing', status: 'Available', capabilities: ['Works offline'],
        releaseVersion: '1.1.0', evidence: 'Private emulator release evidence',
        launchUrl: 'https://app.example.invalid/launch',
        pricing: [{ name: 'Starter', cadence: 'Monthly', currency: 'UGX', amount: 35000, effectiveDate: '2026-11-27' }],
      };
      expect((await req(path)).status).toBe(401);
      expect((await req(path, 'content_manager', 'PUT', { draft: { ...draft, evidence: '' }, version: null })).status).toBe(204);
      expect((await req(path + '/review', 'content_manager', 'POST', { version: (await read()).version })).status).toBe(204);
      expect((await req(path + '/approve', 'super_admin', 'POST', {
        version: (await read()).version,
        approval: { approvedOrigin: 'https://app.example.invalid', approvePricing: true },
      })).status).toBe(400);
      expect((await req(path, 'content_manager', 'PUT', { draft, version: (await read()).version })).status).toBe(204);
      expect((await req('/api/admin/product-drafts/waterops', 'content_manager', 'PUT', { draft, version: null })).status).toBe(400);
      await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'productDrafts/inventory')));
      expect((await req('/api/products/inventory/release')).status).toBe(404);
      expect((await req(path + '/review', 'content_manager', 'POST', { version: (await read()).version })).status).toBe(204);
      const reviewed = (await read()).version;
      const approve = (approvedOrigin: string, approvePricing: boolean) => req(path + '/approve', 'super_admin', 'POST', {
        version: reviewed, approval: { approvedOrigin, approvePricing },
      });
      expect((await approve('https://app.example.invalid', false)).status).toBe(400);
      expect((await approve('https://other.example.invalid', true)).status).toBe(400);
      expect((await approve('https://app.example.invalid', true)).status).toBe(204);
      const approved = { version: (await read()).version };
      expect((await req(path + '/publish', 'content_manager', 'POST', approved)).status).toBe(403);
      const publish = () => req(path + '/publish', 'super_admin', 'POST', approved);
      expect((await Promise.all([publish(), publish()])).map(item => item.status).sort()).toEqual([204, 409]);
      const release = await (await req('/api/products/inventory/release')).json();
      expect(release).toMatchObject({ status: 'Available', launchUrl: draft.launchUrl, pricing: draft.pricing });
      expect(release).not.toHaveProperty('evidence');
      expect(JSON.stringify(release)).not.toContain('Private emulator');
      const history = '/api/admin/product-revisions/inventory/';
      const first = await (await req(history + 'current', 'content_manager')).json();
      expect(first).toMatchObject({ previousRevisionId: '', projection: { status: 'Available' } });
      expect((await req(history + first.revisionId, 'sales_officer')).status).toBe(403);
      await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'productReleases/inventory/revisions/' + first.revisionId)));
      const retired = { ...draft, status: 'Retired', launchUrl: '', pricing: [] };
      expect((await req(path, 'content_manager', 'PUT', { draft: retired, version: (await read()).version })).status).toBe(204);
      expect((await req(path + '/review', 'content_manager', 'POST', { version: (await read()).version })).status).toBe(204);
      expect((await req(path + '/approve', 'super_admin', 'POST', {
        version: (await read()).version, approval: { approvePricing: false },
      })).status).toBe(204);
      expect((await req(path + '/publish', 'super_admin', 'POST', { version: (await read()).version })).status).toBe(204);
      const withdrawn = await (await req('/api/products/inventory/release')).json();
      expect(withdrawn).toMatchObject({ status: 'Retired', launchUrl: '', pricing: [] });
      const second = await (await req(history + 'current', 'content_manager')).json();
      expect(second).toMatchObject({ previousRevisionId: first.revisionId, projection: { status: 'Retired' } });
      expect(await (await req(history + first.revisionId, 'content_manager')).json()).toEqual(first);

    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }, 25_000);
});
