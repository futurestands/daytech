import { createHash, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { flattenFirestoreDocument } from './firebaseAuth';
import { FirestoreStoreError, type FirestoreStore } from './firestoreStore';
import { generateReference } from './storage';
import { computeValidatedQuotationTotals, quotationPayloadSchema } from './validation';

export const QUOTATION_STAFF = ['super_admin', 'admin', 'sales_officer'] as const;
type Input = z.infer<typeof quotationPayloadSchema>;

export class QuotationWriteError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function persistQuotation(
  store: FirestoreStore, input: Input, uid: string, expectedRevision: number | undefined, key: string,
) {
  const { subtotal: _subtotal, discountAmount: _discount, taxAmount: _tax, totalAmount: _total, ...details } = input;
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  const retryPath = 'operationKeys/' + digest(JSON.stringify(['quotation', uid, key]));
  const fingerprint = digest(JSON.stringify([details, expectedRevision]));
  async function replay() {
    const existing = await store.get(retryPath);
    if (!existing) return null;
    const result = flattenFirestoreDocument(existing);
    if (result.fingerprint !== fingerprint) throw new QuotationWriteError(409, 'This request key was used for different details.');
    return { quotationNumber: String(result.quotationNumber), revision: Number(result.revision), totalAmount: Number(result.totalAmount) };
  }
  const replayed = await replay();
  if (replayed) return replayed;

  if (!['Draft', 'Sent'].includes(details.status)) {
    throw new QuotationWriteError(400, 'Choose Draft or Sent when saving quotation details.');
  }
  const quotationNumber = details.quotationNumber ?? generateReference('QTE');
  const path = 'quotations/' + quotationNumber;
  const current = details.quotationNumber ? await store.get(path) : null;
  const previous = current ? flattenFirestoreDocument(current) : null;
  const previousRevision = Number(previous?.revision ?? 0);
  if (details.quotationNumber && !current) throw new QuotationWriteError(404, 'Quotation not found.');
  if (current && previousRevision !== expectedRevision) throw new QuotationWriteError(409, 'This quotation changed. Reopen it before saving.');
  if (previous && !['Draft', 'Sent'].includes(String(previous.status))) {
    throw new QuotationWriteError(409, 'This quotation is closed. Create a separate quotation for new terms.');
  }
  if (previous && ((previous.clientUid && previous.clientUid !== details.clientUid) ||
    (previous.enquiryId && previous.enquiryId !== details.enquiryId))) {
    throw new QuotationWriteError(409, 'Existing ownership and enquiry links cannot be reassigned.');
  }
  if (details.clientUid) await assertCustomer(store, details.clientUid, details.clientEmail);
  const enquiry = details.enquiryId ? await store.get('enquiries/' + details.enquiryId) : null;
  const source = enquiry && flattenFirestoreDocument(enquiry);
  if (details.enquiryId && (!source || !enquiry || source.status === 'Archived' ||
    (source.submitterUid && source.submitterUid !== details.clientUid) ||
    (details.clientUid && source.submitterUid !== details.clientUid) ||
    emailKey(source.email) !== emailKey(details.clientEmail))) {
    throw new QuotationWriteError(409, 'The enquiry must match the customer. Link the guest account first.');
  }

  const revision = previousRevision + 1;
  const { items, ...totals } = computeValidatedQuotationTotals(details.items, details.discountPercent, details.taxPercent);
  const header = {
    quotationNumber, revision, previousRevision: previousRevision || null,
    enquiryId: details.enquiryId || undefined, clientUid: details.clientUid || undefined,
    clientName: details.clientName, clientOrganisation: details.clientOrganisation, clientEmail: details.clientEmail,
    clientTelephone: details.clientTelephone || undefined, clientCountry: details.clientCountry || undefined,
    title: details.title, currency: details.currency, ...totals,
    status: details.status, validUntil: details.validUntil, paymentTerms: details.paymentTerms, notes: details.notes || undefined,
    preparedByName: String(previous?.preparedByName || 'DayTech Sales Desk'),
    preparedByEmail: String(previous?.preparedByEmail || 'sales@daytechsolutions.ug'),
    createdByUid: String(previous?.createdByUid || uid), updatedByUid: uid,
  };
  const headWrite = store.put(path, header, current ? { updateTime: current.updateTime } : { exists: false },
    current ? ['updatedAt'] : ['createdAt', 'updatedAt']);
  if ('update' in headWrite && current?.fields.createdAt) headWrite.update.fields.createdAt = current.fields.createdAt;

  const oldItems = current ? await store.list(path + '/items') : [];
  const result = { quotationNumber, revision, totalAmount: totals.totalAmount };
  const writes = [
    headWrite,
    ...oldItems.map(item => ({ delete: item.name, currentDocument: { updateTime: item.updateTime } })),
    ...items.map((item, index) => store.put(`${path}/items/r${revision}-${index + 1}`, {
      ...item, quotationId: quotationNumber, clientUid: details.clientUid || undefined,
    }, { exists: false }, ['createdAt'])),
    store.put(`${path}/revisions/${revision}`, { ...header, items }, { exists: false }, ['createdAt']),
    store.put('auditLogs/' + randomUUID(), { actorUid: uid, actorEmail: '', action: 'QUOTATION_REVISION_SAVED', target: quotationNumber, revision },
      { exists: false }, ['createdAt']),
    store.put(retryPath, { ...result, fingerprint }, { exists: false }, ['createdAt']),
  ];
  if (enquiry && source && details.status === 'Sent' && ['New', 'In Review', 'Quotation Sent'].includes(String(source.status))) {
    writes.push(updateDocument(store, 'enquiries/' + details.enquiryId, enquiry, { status: 'Quotation Sent' }));
  }
  try {
    await store.commit(writes);
  } catch (error) {
    if (!(error instanceof FirestoreStoreError) || ![409, 412].includes(error.status) && error.code !== 'FAILED_PRECONDITION') throw error;
    const retry = await replay();
    if (retry) return retry;
    throw new QuotationWriteError(409, 'The quotation changed while saving. Refresh and try again.');
  }
  return result;
}

const emailKey = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';

async function assertCustomer(store: FirestoreStore, uid: string, email: unknown) {
  if (!/^[\w-]{1,128}$/.test(uid) || !emailKey(email)) throw new QuotationWriteError(400, 'Invalid customer account.');
  const [account, info] = await Promise.all([store.get('users/' + uid), store.get('users/' + uid + '/private/info')]);
  const profile = account && flattenFirestoreDocument(account);
  const privateProfile = info && flattenFirestoreDocument(info);
  if (profile?.active !== true || profile.role !== 'client' || privateProfile?.uid !== uid || privateProfile.emailVerified !== true ||
    emailKey(privateProfile.email) !== emailKey(email)) {
    throw new QuotationWriteError(409, 'An active customer with the matching verified email is required.');
  }
}

function updateDocument(store: FirestoreStore, path: string, document: NonNullable<Awaited<ReturnType<FirestoreStore['get']>>>, fields: Record<string, string>) {
  const write = store.put(path, fields, { updateTime: document.updateTime }, ['updatedAt']);
  if ('update' in write) write.update.fields = { ...document.fields, ...write.update.fields };
  return write;
}

export async function linkGuestEnquiry(store: FirestoreStore, id: string, clientUid: string, uid: string) {
  const path = 'enquiries/' + id;
  const enquiry = await store.get(path);
  if (!enquiry) throw new QuotationWriteError(404, 'Enquiry not found.');
  const source = flattenFirestoreDocument(enquiry);
  if (source.submitterUid === clientUid) return;
  if (source.submitterUid || ['Archived', 'Converted'].includes(String(source.status))) {
    throw new QuotationWriteError(409, 'The enquiry cannot be reassigned.');
  }
  await assertCustomer(store, clientUid, source.email);
  await store.commit([
    updateDocument(store, path, enquiry, { submitterUid: clientUid }),
    store.put('auditLogs/' + randomUUID(), { actorUid: uid, actorEmail: '', action: 'GUEST_ENQUIRY_LINKED', target: id, clientUid },
      { exists: false }, ['createdAt']),
  ]);
}

export async function convertQuotationToProject(store: FirestoreStore, id: string, revision: number, uid: string) {
  const path = 'quotations/' + id;
  const projectPath = 'projects/' + id;
  const quotation = await store.get(path);
  if (!quotation) throw new QuotationWriteError(404, 'Quotation not found.');
  const quote = flattenFirestoreDocument(quotation);
  if (quote.status !== 'Accepted' || quote.revision !== revision || typeof quote.clientUid !== 'string') {
    throw new QuotationWriteError(409, 'A current accepted quotation with a verified customer is required.');
  }
  if (quote.projectId === id) return id;
  await assertCustomer(store, quote.clientUid, quote.clientEmail);
  const writes = [
    updateDocument(store, path, quotation, { projectId: id }),
    store.put(projectPath, { ownerUid: quote.clientUid, organisationName: String(quote.clientOrganisation),
      title: String(quote.title).slice(0, 160), stage: 'Discovery', progressPercent: 0 }, { exists: false }, ['createdAt', 'updatedAt']),
    store.put('auditLogs/' + randomUUID(), { actorUid: uid, actorEmail: '', action: 'QUOTATION_PROJECT_CREATED', target: id, revision },
      { exists: false }, ['createdAt']),
  ];
  if (typeof quote.enquiryId === 'string' && /^DTQ-\d{4}-[A-Z0-9]{6}$/.test(quote.enquiryId)) {
    const enquiryPath = 'enquiries/' + quote.enquiryId;
    const enquiry = await store.get(enquiryPath);
    const source = enquiry && flattenFirestoreDocument(enquiry);
    if (!enquiry || source?.submitterUid !== quote.clientUid || source.status !== 'Quotation Sent') {
      throw new QuotationWriteError(409, 'The original enquiry cannot be converted.');
    }
    writes.push(updateDocument(store, enquiryPath, enquiry, { status: 'Converted' }));
  }
  try {
    await store.commit(writes);
  } catch (error) {
    if (!(error instanceof FirestoreStoreError) ||
      (![409, 412].includes(error.status) && error.code !== 'FAILED_PRECONDITION')) throw error;
    const latest = await store.get(path);
    if (!latest || flattenFirestoreDocument(latest).projectId !== id) {
      throw new QuotationWriteError(409, 'The quotation changed during conversion.');
    }
  }
  return id;
}

export async function transitionQuotation(
  store: FirestoreStore, id: string, revision: number, status: string, uid: string, staff: boolean,
) {
  const path = 'quotations/' + id;
  const existing = await store.get(path);
  const current = existing && flattenFirestoreDocument(existing);
  if (!existing || !current || (!staff && current.clientUid !== uid)) {
    throw new QuotationWriteError(404, 'Quotation not found.');
  }
  if (Number(current.revision ?? 0) !== revision) {
    throw new QuotationWriteError(409, 'This quotation changed. Open the latest version.');
  }
  const allowed = staff
    ? (current.status === 'Draft' && status === 'Sent' || current.status === 'Sent' && status === 'Expired')
    : current.status === 'Sent' && ['Accepted', 'Declined'].includes(status);
  if (!allowed) throw new QuotationWriteError(409, 'This quotation cannot change to the requested status.');
  if (!staff && (!/^\d{4}-\d{2}-\d{2}$/.test(String(current.validUntil)) ||
    String(current.validUntil) < new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Kampala' }))) {
    throw new QuotationWriteError(409, 'This quotation is no longer valid.');
  }

  const change = store.put(path, { status, updatedByUid: uid }, { updateTime: existing.updateTime }, ['updatedAt']);
  if ('update' in change) change.update.fields = { ...existing.fields, ...change.update.fields };
  try {
    await store.commit([
      change,
      store.put('auditLogs/' + randomUUID(), { actorUid: uid, actorEmail: '', action: `QUOTATION_${status.toUpperCase()}`, target: id, revision }, { exists: false }, ['createdAt']),
    ]);
  } catch (error) {
    if (error instanceof FirestoreStoreError && (error.status === 409 || error.status === 412 || error.code === 'FAILED_PRECONDITION')) {
      throw new QuotationWriteError(409, 'The quotation changed while saving. Open the latest version.');
    }
    throw error;
  }
}

export function quotationShareDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
