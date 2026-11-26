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
