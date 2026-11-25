import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './client';
import {
  ClientProjectRecord,
  CurrencyCode,
  DemoBookingRecord,
  EnquiryRecord,
  QuotationItemRecord,
  QuotationItemType,
  QuotationStatus,
  SupportTicketRecord,
  UserAccountRecord,
} from '../../types/domain';

function clampStr(value: string, maxLen: number): string {
  const trimmed = value.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export function generateReference(prefix: 'DTQ' | 'DTD' | 'DTC' | 'QTE'): string {
  const year = new Date().getFullYear();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${prefix}-${year}-${code}`;
}

export function toIsoString(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof ts === 'string' && ts) {
    return ts;
  }
  return new Date().toISOString();
}

export interface EnquiryInputPayload {
  fullName: string;
  organisation: string;
  email: string;
  telephone: string;
  country: string;
  industry: string;
  requiredService: string;
  interestedProduct: string;
  projectDescription: string;
  budgetRange: string;
  currency: CurrencyCode;
  timeline: string;
  preferredContactMethod: 'Email' | 'Telephone' | 'WhatsApp' | 'Video Meeting';
  consentAccepted: true;
}

export async function createEnquiryInFirestore(
  input: EnquiryInputPayload
): Promise<{ referenceNumber: string; createdAt: string; status: EnquiryRecord['status'] }> {
  const referenceNumber = generateReference('DTQ');
  const path = `enquiries/${referenceNumber}`;
  const currentUid = auth?.currentUser?.uid;

  const payload: Record<string, unknown> = {
    referenceNumber,
    status: 'New',
    fullName: clampStr(input.fullName, 120),
    organisation: clampStr(input.organisation, 150),
    email: clampStr(input.email, 160),
    telephone: clampStr(input.telephone, 40),
    country: clampStr(input.country, 80),
    industry: clampStr(input.industry, 100),
    requiredService: clampStr(input.requiredService, 120),
    interestedProduct: clampStr(input.interestedProduct || 'None / Custom Solution', 120),
    projectDescription: clampStr(input.projectDescription, 3000),
    budgetRange: clampStr(input.budgetRange, 100),
    currency: input.currency,
    timeline: clampStr(input.timeline, 100),
    preferredContactMethod: input.preferredContactMethod,
    consentAccepted: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (currentUid) {
    payload.submitterUid = clampStr(currentUid, 128);
  }

  try {
    await setDoc(doc(db, 'enquiries', referenceNumber), payload);
    return {
      referenceNumber,
      createdAt: new Date().toISOString(),
      status: 'New',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface DemoInputPayload {
  productSlug: string;
  productName: string;
  fullName: string;
  organisation: string;
  email: string;
  telephone: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  organisationSize: string;
  requirements: string;
}

export async function createDemoBookingInFirestore(
  input: DemoInputPayload
): Promise<{ referenceNumber: string; createdAt: string; status: DemoBookingRecord['status']; timezone: string }> {
  const referenceNumber = generateReference('DTD');
  const path = `demoBookings/${referenceNumber}`;
  const currentUid = auth?.currentUser?.uid;
  const timezone = clampStr(input.timezone || 'Africa/Kampala', 80);

  const payload: Record<string, unknown> = {
    referenceNumber,
    status: 'Pending',
    productSlug: clampStr(input.productSlug, 80),
    productName: clampStr(input.productName, 120),
    fullName: clampStr(input.fullName, 120),
    organisation: clampStr(input.organisation, 150),
    email: clampStr(input.email, 160),
    telephone: clampStr(input.telephone, 40),
    preferredDate: clampStr(input.preferredDate, 40),
    preferredTime: clampStr(input.preferredTime, 40),
    timezone,
    organisationSize: clampStr(input.organisationSize, 60),
    requirements: clampStr(input.requirements, 2000),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (currentUid) {
    payload.submitterUid = clampStr(currentUid, 128);
  }

  try {
    await setDoc(doc(db, 'demoBookings', referenceNumber), payload);
    return {
      referenceNumber,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      timezone,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface ContactInputPayload {
  fullName: string;
  organisation?: string;
  email: string;
  subject: string;
  message: string;
}

export async function createContactMessageInFirestore(
  input: ContactInputPayload
): Promise<{ referenceNumber: string; createdAt: string }> {
  const referenceNumber = generateReference('DTC');
  const path = `contactMessages/${referenceNumber}`;

  const payload: Record<string, unknown> = {
    referenceNumber,
    fullName: clampStr(input.fullName, 120),
    email: clampStr(input.email, 160),
    subject: clampStr(input.subject, 160),
    message: clampStr(input.message, 3000),
    createdAt: serverTimestamp(),
  };

  const org = input.organisation?.trim();
  if (org) {
    payload.organisation = clampStr(org, 150);
  }

  try {
    await setDoc(doc(db, 'contactMessages', referenceNumber), payload);
    return {
      referenceNumber,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncUserAccountOnSignIn(user: User): Promise<UserAccountRecord> {
  const userPath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/info`;

  let existingSnap;
  try {
    existingSnap = await getDoc(doc(db, 'users', user.uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const email = (user.email || '').trim();
  const isBootstrappedAdmin =
    user.emailVerified && email.toLowerCase() === 'mugarurajohnson56@gmail.com';
  const displayName = clampStr(user.displayName || email.split('@')[0] || 'DayTech User', 120);

  if (email.length >= 5 && user.emailVerified) {
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'private', 'info'),
        {
          uid: clampStr(user.uid, 128),
          email: clampStr(email, 160),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }

  if (existingSnap.exists()) {
    const raw = existingSnap.data();
    return {
      uid: String(raw.uid || user.uid),
      displayName: String(raw.displayName || displayName),
      organisationName: raw.organisationName ? String(raw.organisationName) : undefined,
      role: raw.role as UserAccountRecord['role'],
      active: Boolean(raw.active),
      createdAt: toIsoString(raw.createdAt),
      updatedAt: toIsoString(raw.updatedAt),
    };
  }

  const assignedRole: UserAccountRecord['role'] = isBootstrappedAdmin ? 'super_admin' : 'client';
  const newAccountPayload = {
    uid: clampStr(user.uid, 128),
    displayName,
    role: assignedRole,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), newAccountPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  return {
    uid: user.uid,
    displayName,
    role: assignedRole,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function writeAuditLog(action: string, target: string): Promise<void> {
  const actor = auth?.currentUser;
  if (!actor) return;
  const path = 'auditLogs';
  try {
    await addDoc(collection(db, 'auditLogs'), {
      actorUid: clampStr(actor.uid, 128),
      actorEmail: clampStr(actor.email || 'staff@daytech', 160),
      action: clampStr(action, 100),
      target: clampStr(target, 200),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEnquiryInFirestore(
  id: string,
  status: EnquiryRecord['status'],
  internalNotes?: string
): Promise<void> {
  const path = `enquiries/${id}`;
  const patch: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (internalNotes !== undefined) {
    patch.internalNotes = clampStr(internalNotes, 1500);
  }
  try {
    await updateDoc(doc(db, 'enquiries', id), patch);
    await writeAuditLog(`ENQUIRY_STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateDemoInFirestore(
  id: string,
  status: DemoBookingRecord['status']
): Promise<void> {
  const path = `demoBookings/${id}`;
  try {
    await updateDoc(doc(db, 'demoBookings', id), {
      status,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog(`DEMO_STATUS_${status.toUpperCase()}`, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createSupportTicketInFirestore(input: {
  ownerUid: string;
  organisationName: string;
  subject: string;
  category: string;
  priority: SupportTicketRecord['priority'];
  description: string;
}): Promise<string> {
  const path = 'supportTickets';
  try {
    const ref = await addDoc(collection(db, 'supportTickets'), {
      ownerUid: clampStr(input.ownerUid, 128),
      organisationName: clampStr(input.organisationName, 150),
      subject: clampStr(input.subject, 160),
      category: clampStr(input.category, 60),
      priority: input.priority,
      status: 'Open',
      description: clampStr(input.description, 3000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSupportTicketInFirestore(
  id: string,
  patch: {
    status?: SupportTicketRecord['status'];
    priority?: SupportTicketRecord['priority'];
  }
): Promise<void> {
  const path = `supportTickets/${id}`;
  try {
    await updateDoc(doc(db, 'supportTickets', id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog('TICKET_UPDATED', `${id} (${patch.status || patch.priority || 'updated'})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createProjectInFirestore(input: {
  ownerUid: string;
  organisationName: string;
  title: string;
  stage: ClientProjectRecord['stage'];
  progressPercent: number;
  summary?: string;
}): Promise<string> {
  const path = 'projects';
  const payload: Record<string, unknown> = {
    ownerUid: clampStr(input.ownerUid, 128),
    organisationName: clampStr(input.organisationName, 150),
    title: clampStr(input.title, 160),
    stage: input.stage,
    progressPercent: Math.max(0, Math.min(100, Math.round(input.progressPercent))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.summary?.trim()) {
    payload.summary = clampStr(input.summary, 2000);
  }

  try {
    const ref = await addDoc(collection(db, 'projects'), payload);
    await writeAuditLog('PROJECT_CREATED', `${input.title} (${input.organisationName})`);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProjectInFirestore(
  id: string,
  patch: {
    stage?: ClientProjectRecord['stage'];
    progressPercent?: number;
    summary?: string;
    title?: string;
  }
): Promise<void> {
  const path = `projects/${id}`;
  const cleanPatch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (patch.stage) cleanPatch.stage = patch.stage;
  if (typeof patch.progressPercent === 'number') {
    cleanPatch.progressPercent = Math.max(0, Math.min(100, Math.round(patch.progressPercent)));
  }
  if (patch.summary !== undefined) cleanPatch.summary = clampStr(patch.summary, 2000);
  if (patch.title !== undefined) cleanPatch.title = clampStr(patch.title, 160);

  try {
    await updateDoc(doc(db, 'projects', id), cleanPatch);
    await writeAuditLog('PROJECT_UPDATED', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserAccountInFirestore(
  targetUid: string,
  patch: {
    role?: UserAccountRecord['role'];
    active?: boolean;
    organisationName?: string;
  }
): Promise<void> {
  const path = `users/${targetUid}`;
  const cleanPatch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (patch.role) cleanPatch.role = patch.role;
  if (typeof patch.active === 'boolean') cleanPatch.active = patch.active;
  if (patch.organisationName !== undefined) {
    cleanPatch.organisationName = clampStr(patch.organisationName, 150);
  }

  try {
    await updateDoc(doc(db, 'users', targetUid), cleanPatch);
    await writeAuditLog('USER_RBAC_UPDATED', `${targetUid} (${patch.role || 'status'})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export interface QuotationLineInput {
  itemType: QuotationItemType;
  description: string;
  details?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationSaveInput {
  quotationNumber?: string;
  enquiryId?: string;
  clientUid?: string;
  clientName: string;
  clientOrganisation: string;
  clientEmail: string;
  clientTelephone?: string;
  clientCountry?: string;
  title: string;
  currency: CurrencyCode;
  discountPercent: number;
  taxPercent: number;
  status: QuotationStatus;
  validUntil: string;
  paymentTerms: string;
  notes?: string;
  items: QuotationLineInput[];
}

export function computeQuotationTotals(
  items: QuotationLineInput[],
  discountPercent: number,
  taxPercent: number
) {
  const safeDiscountPct = Math.max(0, Math.min(100, Number.isFinite(discountPercent) ? discountPercent : 0));
  const safeTaxPct = Math.max(0, Math.min(100, Number.isFinite(taxPercent) ? taxPercent : 0));

  const normalizedItems = items.map((item, idx) => {
    const qty = Math.max(0.01, Math.min(100000, Number(item.quantity) || 1));
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const lineTotal = Math.round(qty * price * 100) / 100;
    return {
      sortOrder: idx,
      itemType: item.itemType,
      description: clampStr(item.description, 240),
      details: item.details?.trim() ? clampStr(item.details, 500) : undefined,
      unit: clampStr(item.unit || 'Project', 40),
      quantity: Math.round(qty * 100) / 100,
      unitPrice: Math.round(price * 100) / 100,
      lineTotal,
    };
  });

  const subtotal = Math.round(normalizedItems.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  const discountAmount = Math.round(subtotal * (safeDiscountPct / 100) * 100) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * (safeTaxPct / 100) * 100) / 100;
  const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    items: normalizedItems,
    subtotal,
    discountPercent: Math.round(safeDiscountPct * 100) / 100,
    discountAmount,
    taxPercent: Math.round(safeTaxPct * 100) / 100,
    taxAmount,
    totalAmount,
  };
}

export async function fetchQuotationItemsFromFirestore(quotationId: string): Promise<QuotationItemRecord[]> {
  const path = `quotations/${quotationId}/items`;
  try {
    const q = query(collection(db, 'quotations', quotationId, 'items'), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const r = d.data();
      return {
        id: d.id,
        quotationId: String(r.quotationId || quotationId),
        clientUid: r.clientUid ? String(r.clientUid) : undefined,
        sortOrder: Number(r.sortOrder ?? 0),
        itemType: r.itemType as QuotationItemType,
        description: String(r.description || ''),
        details: r.details ? String(r.details) : undefined,
        unit: String(r.unit || 'Project'),
        quantity: Number(r.quantity ?? 1),
        unitPrice: Number(r.unitPrice ?? 0),
        lineTotal: Number(r.lineTotal ?? 0),
        createdAt: toIsoString(r.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveQuotationInFirestore(
  input: QuotationSaveInput
): Promise<{ quotationNumber: string }> {
  const actor = auth?.currentUser;
  if (!actor) {
    throw new Error('Signed-in DayTech staff account is required to save quotations.');
  }

  const isUpdate = Boolean(input.quotationNumber);
  const quotationNumber = input.quotationNumber || generateReference('QTE');
  const path = `quotations/${quotationNumber}`;
  const totals = computeQuotationTotals(input.items, input.discountPercent, input.taxPercent);
  const cleanClientUid = input.clientUid?.trim() ? clampStr(input.clientUid, 128) : undefined;

  const quotationDocRef = doc(db, 'quotations', quotationNumber);
  const batch = writeBatch(db);

  if (isUpdate) {
    const existingItemsSnap = await getDocs(collection(db, 'quotations', quotationNumber, 'items')).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, `${path}/items`)
    );
    existingItemsSnap.docs.forEach((itemDoc) => {
      batch.delete(itemDoc.ref);
    });

    const updatePayload: Record<string, unknown> = {
      clientName: clampStr(input.clientName, 120),
      clientOrganisation: clampStr(input.clientOrganisation, 150),
      clientEmail: clampStr(input.clientEmail, 160),
      title: clampStr(input.title, 180),
      currency: input.currency,
      subtotal: totals.subtotal,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      taxPercent: totals.taxPercent,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: input.status,
      validUntil: clampStr(input.validUntil, 40),
      paymentTerms: clampStr(input.paymentTerms, 600),
      updatedAt: serverTimestamp(),
    };
    if (input.enquiryId?.trim()) updatePayload.enquiryId = clampStr(input.enquiryId, 64);
    if (cleanClientUid) updatePayload.clientUid = cleanClientUid;
    if (input.clientTelephone?.trim()) updatePayload.clientTelephone = clampStr(input.clientTelephone, 40);
    if (input.clientCountry?.trim()) updatePayload.clientCountry = clampStr(input.clientCountry, 80);
    if (input.notes?.trim()) updatePayload.notes = clampStr(input.notes, 2000);

    batch.update(quotationDocRef, updatePayload);
  } else {
    const createPayload: Record<string, unknown> = {
      quotationNumber,
      clientName: clampStr(input.clientName, 120),
      clientOrganisation: clampStr(input.clientOrganisation, 150),
      clientEmail: clampStr(input.clientEmail, 160),
      title: clampStr(input.title, 180),
      currency: input.currency,
      subtotal: totals.subtotal,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      taxPercent: totals.taxPercent,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: input.status === 'Sent' ? 'Sent' : 'Draft',
      validUntil: clampStr(input.validUntil, 40),
      paymentTerms: clampStr(input.paymentTerms, 600),
      preparedByName: clampStr(actor.displayName || actor.email || 'DayTech Sales Desk', 120),
      preparedByEmail: clampStr(actor.email || 'sales@daytech', 160),
      createdByUid: clampStr(actor.uid, 128),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.enquiryId?.trim()) createPayload.enquiryId = clampStr(input.enquiryId, 64);
    if (cleanClientUid) createPayload.clientUid = cleanClientUid;
    if (input.clientTelephone?.trim()) createPayload.clientTelephone = clampStr(input.clientTelephone, 40);
    if (input.clientCountry?.trim()) createPayload.clientCountry = clampStr(input.clientCountry, 80);
    if (input.notes?.trim()) createPayload.notes = clampStr(input.notes, 2000);

    batch.set(quotationDocRef, createPayload);
  }

  totals.items.forEach((item, index) => {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const itemId = `item-${String(index + 1).padStart(2, '0')}-${suffix}`;
    const itemPayload: Record<string, unknown> = {
      quotationId: quotationNumber,
      sortOrder: item.sortOrder,
      itemType: item.itemType,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      createdAt: serverTimestamp(),
    };
    if (cleanClientUid) {
      itemPayload.clientUid = cleanClientUid;
    }
    if (item.details) {
      itemPayload.details = item.details;
    }
    batch.set(doc(db, 'quotations', quotationNumber, 'items', itemId), itemPayload);
  });

  try {
    await batch.commit();
    await writeAuditLog(
      isUpdate ? 'QUOTATION_UPDATED' : 'QUOTATION_CREATED',
      `${quotationNumber} (${input.clientOrganisation} · ${input.currency} ${totals.totalAmount})`
    );

    // Sync linked enquiry status when quotation is marked Sent
    if (input.status === 'Sent' && input.enquiryId?.trim()) {
      const enqRef = doc(db, 'enquiries', input.enquiryId.trim());
      const enqSnap = await getDoc(enqRef).catch(() => null);
      if (enqSnap?.exists()) {
        const currentStatus = enqSnap.data().status;
        if (currentStatus === 'New' || currentStatus === 'In Review') {
          await updateDoc(enqRef, {
            status: 'Quotation Sent',
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    return { quotationNumber };
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function updateQuotationStatusInFirestore(
  quotationId: string,
  status: QuotationStatus,
  asStaff = true
): Promise<void> {
  const path = `quotations/${quotationId}`;
  try {
    await updateDoc(doc(db, 'quotations', quotationId), {
      status,
      updatedAt: serverTimestamp(),
    });
    if (asStaff) {
      await writeAuditLog(`QUOTATION_STATUS_${status.toUpperCase()}`, quotationId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

