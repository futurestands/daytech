import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

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
