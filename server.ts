import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function parseBooleanFlag(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === '') {
    return false;
  }
  return fallback;
}

// Persistent storage verification:
// Ephemeral serverless runtimes (such as Vercel without an external DB) do not retain local disk files.
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'daytech-store.json');

interface StoreSchema {
  enquiries: any[];
  demos: any[];
  contacts: any[];
  quotations?: any[];
  auditLogs: any[];
}

function getStorageStatus(): {
  persistent: boolean;
  provider: 'local-file-store' | 'unavailable';
  note: string;
} {
  if (process.env.VERCEL === '1') {
    return {
      persistent: false,
      provider: 'unavailable',
      note: 'Running in an ephemeral Vercel serverless environment without Firestore configured. Enable Phase 2 Firestore for durable submissions.',
    };
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
    return {
      persistent: true,
      provider: 'local-file-store',
      note: 'Persisted to local server JSON store (Phase 1). Migrate to Firestore in Phase 2 for multi-instance cloud hosting.',
    };
  } catch {
    return {
      persistent: false,
      provider: 'unavailable',
      note: 'Server storage directory is read-only or unavailable. Submissions are disabled to avoid unpersisted data.',
    };
  }
}

function ensureStore(): StoreSchema {
  const status = getStorageStatus();
  if (!status.persistent) {
    throw new Error(status.note);
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: StoreSchema = {
      enquiries: [],
      demos: [],
      contacts: [],
      quotations: [],
      auditLogs: [],
    };
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(initial, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as StoreSchema;
  if (!Array.isArray(parsed.quotations)) {
    parsed.quotations = [];
  }
  return parsed;
}

function saveStore(store: StoreSchema): void {
  const status = getStorageStatus();
  if (!status.persistent) {
    throw new Error(status.note);
  }
  const tmpFile = `${DATA_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function generateReference(prefix: 'DTQ' | 'DTD' | 'DTC' | 'QTE'): string {
  const year = new Date().getFullYear();
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${year}-${code}`;
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Security headers middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '200kb' }));

// Lightweight in-memory rate limiter for write endpoints
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests = 25, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
    }
    bucket.count += 1;
    return next();
  };
}

// Zod Validation Schemas
const enquirySchema = z.object({
  referenceNumber: z.string().regex(/^DTQ-[0-9]{4}-[A-Z0-9]{6}$/).optional(),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  organisation: z.string().trim().min(2, 'Organisation name is required').max(150),
  email: z.string().trim().email('Valid email address is required').max(160),
  telephone: z.string().trim().min(7, 'Valid telephone number is required').max(40),
  country: z.string().trim().min(2, 'Country is required').max(80),
  industry: z.string().trim().min(2, 'Industry is required').max(100),
  requiredService: z.string().trim().min(2, 'Required service is required').max(120),
  interestedProduct: z.string().trim().max(120).optional().default('None / Custom Solution'),
  projectDescription: z
    .string()
    .trim()
    .min(15, 'Please describe your project requirements (at least 15 characters)')
    .max(3000),
  budgetRange: z.string().trim().min(2, 'Estimated budget range is required').max(100),
  currency: z.enum(['UGX', 'USD', 'KES']).default('UGX'),
  timeline: z.string().trim().min(2, 'Preferred timeline is required').max(100),
  preferredContactMethod: z.enum(['Email', 'Telephone', 'WhatsApp', 'Video Meeting']),
  consentAccepted: z.literal(true, {
    error: 'Consent to process submitted information is required',
  }),
});

const demoSchema = z.object({
  referenceNumber: z.string().regex(/^DTD-[0-9]{4}-[A-Z0-9]{6}$/).optional(),
  productSlug: z.string().trim().min(1, 'Please select a product').max(80),
  productName: z.string().trim().min(1).max(120),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  organisation: z.string().trim().min(2, 'Organisation is required').max(150),
  email: z.string().trim().email('Valid email address is required').max(160),
  telephone: z.string().trim().min(7, 'Valid telephone number is required').max(40),
  preferredDate: z.string().trim().min(4, 'Preferred date is required').max(40),
  preferredTime: z.string().trim().min(2, 'Preferred time is required').max(40),
  timezone: z.string().trim().default('Africa/Kampala'),
  organisationSize: z.string().trim().min(1, 'Organisation size is required').max(60),
  requirements: z.string().trim().min(10, 'Please share brief demonstration goals').max(2000),
});

const contactSchema = z.object({
  referenceNumber: z.string().regex(/^DTC-[0-9]{4}-[A-Z0-9]{6}$/).optional(),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  organisation: z.string().trim().max(150).optional().default(''),
  email: z.string().trim().email('Valid email address is required').max(160),
  subject: z.string().trim().min(3, 'Subject is required').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
});

const quotationLineSchema = z.object({
  itemType: z.enum(['Service', 'Software License', 'Implementation', 'Infrastructure', 'Support']),
  description: z.string().trim().min(2).max(240),
  details: z.string().trim().max(500).optional().default(''),
  unit: z.string().trim().min(1).max(40),
  quantity: z.number().positive().max(100000),
  unitPrice: z.number().min(0),
});

const quotationPayloadSchema = z.object({
  quotationNumber: z.string().regex(/^QTE-[0-9]{4}-[A-Z0-9]{6}$/).optional(),
  enquiryId: z.string().trim().max(64).optional().default(''),
  clientName: z.string().trim().min(2).max(120),
  clientOrganisation: z.string().trim().min(2).max(150),
  clientEmail: z.string().trim().email().max(160),
  clientTelephone: z.string().trim().max(40).optional().default(''),
  clientCountry: z.string().trim().max(80).optional().default(''),
  title: z.string().trim().min(3).max(180),
  currency: z.enum(['UGX', 'USD', 'KES']).default('UGX'),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(18),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']).default('Draft'),
  validUntil: z.string().trim().min(8).max(40),
  paymentTerms: z.string().trim().min(2).max(600),
  notes: z.string().trim().max(2000).optional().default(''),
  items: z.array(quotationLineSchema).min(1).max(50),
});

// Backend-only ADMIN_ACCESS_KEY verification (never exposed to frontend)
function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.ADMIN_ACCESS_KEY?.trim() || '';
  if (!configuredKey) {
    if (isProduction) {
      return res.status(503).json({
        error: 'ADMIN_ACCESS_KEY is not configured on the server. Administrative routes are locked in production.',
        requiresKey: true,
        unconfiguredProduction: true,
      });
    }
    return next();
  }
  const provided = req.headers['x-admin-token'];
  if (typeof provided !== 'string' || !timingSafeMatch(provided.trim(), configuredKey)) {
    return res.status(401).json({
      error: 'Administrative authentication required.',
      requiresKey: true,
    });
  }
  return next();
}

// Health & Public Config (exposes ONLY non-sensitive public metadata & boolean flags)
app.get('/api/health', (_req, res) => {
  const storage = getStorageStatus();
  res.json({
    status: 'ok',
    storage,
    timestamp: new Date().toISOString(),
  });
});

function normalizeCurrency(raw: string | undefined): 'UGX' | 'USD' | 'KES' {
  const val = (raw || '').trim().toUpperCase();
  if (val.includes('UGX')) return 'UGX';
  if (val.includes('KES')) return 'KES';
  if (val.includes('USD')) return 'USD';
  return 'UGX';
}

function normalizeTimezone(raw: string | undefined): string {
  const val = (raw || '').trim();
  if (!val || val.toLowerCase() === 'uganda' || val.toLowerCase() === 'eat') {
    return 'Africa/Kampala';
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: val });
    return val;
  } catch {
    return 'Africa/Kampala';
  }
}

app.get('/api/public-config', (_req, res) => {
  const whatsappNumber = process.env.OFFICIAL_WHATSAPP_NUMBER?.trim() || null;
  const firebaseFlag = parseBooleanFlag(process.env.VITE_FEATURE_FIREBASE, false);
  const paymentsFlag = parseBooleanFlag(process.env.VITE_FEATURE_PAYMENTS, false);
  const calendarFlag = parseBooleanFlag(process.env.VITE_FEATURE_GOOGLE_CALENDAR, false);
  const whatsappFlag = parseBooleanFlag(process.env.VITE_FEATURE_WHATSAPP, false);

  res.json({
    defaultCurrency: normalizeCurrency(process.env.DEFAULT_CURRENCY),
    defaultTimezone: normalizeTimezone(process.env.DEFAULT_TIMEZONE),
    officialEmail: process.env.OFFICIAL_EMAIL?.trim() || null,
    officialPhone: process.env.OFFICIAL_PHONE?.trim() || null,
    officialWhatsApp: whatsappFlag && whatsappNumber ? whatsappNumber : null,
    officialAddress: process.env.OFFICIAL_ADDRESS?.trim() || null,
    features: {
      firebaseEnabled: firebaseFlag,
      paymentsEnabled: paymentsFlag,
      googleCalendarEnabled: calendarFlag,
      whatsappEnabled: Boolean(whatsappFlag && whatsappNumber),
    },
    storage: getStorageStatus(),
  });
});

// Public Lead & Enquiry Submission (fails with 503 if persistent storage is unavailable)
app.post('/api/enquiries', rateLimit(20, 60_000), (req, res) => {
  const storage = getStorageStatus();
  if (!storage.persistent) {
    return res.status(503).json({ error: storage.note, storageUnavailable: true });
  }

  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const store = ensureStore();
    const now = new Date().toISOString();
    const { referenceNumber: providedRef, ...rest } = parsed.data;
    const record = {
      id: crypto.randomUUID(),
      referenceNumber: providedRef || generateReference('DTQ'),
      createdAt: now,
      updatedAt: now,
      status: 'New' as const,
      ...rest,
    };

    store.enquiries.unshift(record);
    store.auditLogs.unshift({
      id: crypto.randomUUID(),
      timestamp: now,
      actor: 'Public Web Portal',
      action: 'ENQUIRY_CREATED',
      target: record.referenceNumber,
    });
    saveStore(store);

    return res.status(201).json({
      referenceNumber: record.referenceNumber,
      createdAt: record.createdAt,
      status: record.status,
    });
  } catch (err) {
    console.error('Failed to persist enquiry:', err);
    return res.status(500).json({ error: 'Unable to persist enquiry in storage. Please try again.' });
  }
});

// Public Demo Request Submission
app.post('/api/demos', rateLimit(20, 60_000), (req, res) => {
  const storage = getStorageStatus();
  if (!storage.persistent) {
    return res.status(503).json({ error: storage.note, storageUnavailable: true });
  }

  const parsed = demoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const store = ensureStore();
    const now = new Date().toISOString();
    const { referenceNumber: providedRef, ...rest } = parsed.data;
    const record = {
      id: crypto.randomUUID(),
      referenceNumber: providedRef || generateReference('DTD'),
      createdAt: now,
      updatedAt: now,
      status: 'Pending' as const,
      ...rest,
    };

    store.demos.unshift(record);
    store.auditLogs.unshift({
      id: crypto.randomUUID(),
      timestamp: now,
      actor: 'Public Web Portal',
      action: 'DEMO_BOOKED',
      target: `${record.referenceNumber} (${record.productName})`,
    });
    saveStore(store);

    return res.status(201).json({
      referenceNumber: record.referenceNumber,
      createdAt: record.createdAt,
      status: record.status,
      timezone: record.timezone,
    });
  } catch (err) {
    console.error('Failed to persist demo booking:', err);
    return res.status(500).json({ error: 'Unable to persist demonstration request in storage.' });
  }
});

// Public Contact Message Submission
app.post('/api/contact', rateLimit(20, 60_000), (req, res) => {
  const storage = getStorageStatus();
  if (!storage.persistent) {
    return res.status(503).json({ error: storage.note, storageUnavailable: true });
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const store = ensureStore();
    const now = new Date().toISOString();
    const { referenceNumber: providedRef, ...rest } = parsed.data;
    const record = {
      id: crypto.randomUUID(),
      referenceNumber: providedRef || generateReference('DTC'),
      createdAt: now,
      ...rest,
    };

    store.contacts.unshift(record);
    store.auditLogs.unshift({
      id: crypto.randomUUID(),
      timestamp: now,
      actor: 'Public Web Portal',
      action: 'CONTACT_RECEIVED',
      target: record.referenceNumber,
    });
    saveStore(store);

    return res.status(201).json({
      referenceNumber: record.referenceNumber,
      createdAt: record.createdAt,
    });
  } catch (err) {
    console.error('Failed to persist contact message:', err);
    return res.status(500).json({ error: 'Unable to persist contact message in storage.' });
  }
});

// Client Portal verified reference lookup (requires both reference number AND matching email)
app.get('/api/portal/lookup', rateLimit(30, 60_000), (req, res) => {
  const storage = getStorageStatus();
  if (!storage.persistent) {
    return res.status(503).json({ error: storage.note });
  }

  const ref = String(req.query.ref || '').trim().toUpperCase();
  const email = String(req.query.email || '').trim().toLowerCase();

  if (!ref || !email) {
    return res.status(400).json({ error: 'Reference number and email address are required.' });
  }

  const store = ensureStore();
  const enquiry = store.enquiries.find(
    (item) => item.referenceNumber === ref && item.email.toLowerCase() === email
  );
  if (enquiry) {
    return res.json({
      type: 'Quotation Enquiry',
      referenceNumber: enquiry.referenceNumber,
      status: enquiry.status,
      organisation: enquiry.organisation,
      service: enquiry.requiredService,
      product: enquiry.interestedProduct,
      currency: enquiry.currency,
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt,
    });
  }

  const demo = store.demos.find(
    (item) => item.referenceNumber === ref && item.email.toLowerCase() === email
  );
  if (demo) {
    return res.json({
      type: 'Product Demonstration',
      referenceNumber: demo.referenceNumber,
      status: demo.status,
      organisation: demo.organisation,
      product: demo.productName,
      preferredDate: demo.preferredDate,
      preferredTime: demo.preferredTime,
      timezone: demo.timezone,
      createdAt: demo.createdAt,
      updatedAt: demo.updatedAt,
    });
  }

  const quotation = (store.quotations || []).find(
    (item) => item.quotationNumber === ref && item.clientEmail?.toLowerCase() === email
  );
  if (quotation) {
    return res.json({
      type: 'Formal Quotation',
      referenceNumber: quotation.quotationNumber,
      status: quotation.status,
      organisation: quotation.clientOrganisation,
      service: quotation.title,
      currency: quotation.currency,
      totalAmount: quotation.totalAmount,
      validUntil: quotation.validUntil,
      quotation,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
    });
  }

  return res.status(404).json({
    error: 'No matching record found for that reference number and email combination.',
  });
});

// Admin Overview & Operations API
app.get('/api/admin/overview', requireAdminAccess, (_req, res) => {
  const storage = getStorageStatus();
  if (!storage.persistent) {
    return res.status(503).json({ error: storage.note });
  }
  const store = ensureStore();
  const hasKey = Boolean(process.env.ADMIN_ACCESS_KEY?.trim());
  res.json({
    adminAuthMode: hasKey ? 'token-protected' : 'local-dev-unkeyed',
    storage,
    stats: {
      totalEnquiries: store.enquiries.length,
      pendingQuotations: store.enquiries.filter((e) => e.status === 'New' || e.status === 'In Review')
        .length,
      demoRequests: store.demos.length,
      pendingDemos: store.demos.filter((d) => d.status === 'Pending').length,
      contactMessages: store.contacts.length,
    },
    enquiries: store.enquiries,
    demos: store.demos,
    contacts: store.contacts,
    quotations: store.quotations || [],
    auditLogs: store.auditLogs.slice(0, 50),
  });
});

app.patch('/api/admin/enquiries/:id', requireAdminAccess, (req, res) => {
  const statusSchema = z.object({
    status: z.enum(['New', 'In Review', 'Quotation Sent', 'Converted', 'Archived']),
    internalNotes: z.string().max(1500).optional(),
  });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid status update' });
  }

  const store = ensureStore();
  const idx = store.enquiries.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  const now = new Date().toISOString();
  store.enquiries[idx] = {
    ...store.enquiries[idx],
    status: parsed.data.status,
    internalNotes: parsed.data.internalNotes ?? store.enquiries[idx].internalNotes,
    updatedAt: now,
  };
  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: now,
    actor: 'Administrator',
    action: `ENQUIRY_STATUS_${parsed.data.status.toUpperCase().replace(/\s+/g, '_')}`,
    target: store.enquiries[idx].referenceNumber,
  });
  saveStore(store);

  return res.json(store.enquiries[idx]);
});

app.patch('/api/admin/demos/:id', requireAdminAccess, (req, res) => {
  const demoStatusSchema = z.object({
    status: z.enum(['Pending', 'Confirmed', 'Rescheduled', 'Declined']),
  });
  const parsed = demoStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid demonstration status' });
  }

  const store = ensureStore();
  const idx = store.demos.findIndex((d) => d.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Demo booking not found' });
  }

  const now = new Date().toISOString();
  store.demos[idx] = {
    ...store.demos[idx],
    status: parsed.data.status,
    updatedAt: now,
  };
  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: now,
    actor: 'Administrator',
    action: `DEMO_STATUS_${parsed.data.status.toUpperCase()}`,
    target: store.demos[idx].referenceNumber,
  });
  saveStore(store);

  return res.json(store.demos[idx]);
});

app.post('/api/admin/quotations', requireAdminAccess, (req, res) => {
  const parsed = quotationPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid quotation details',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const store = ensureStore();
  const now = new Date().toISOString();
  const data = parsed.data;
  const normalizedItems = data.items.map((item, idx) => {
    const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    return {
      id: `item-${idx + 1}`,
      quotationId: data.quotationNumber || 'draft',
      sortOrder: idx,
      itemType: item.itemType,
      description: item.description,
      details: item.details || undefined,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal,
      createdAt: now,
    };
  });

  const subtotal = Math.round(normalizedItems.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
  const discountAmount = Math.round(subtotal * (data.discountPercent / 100) * 100) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * (data.taxPercent / 100) * 100) / 100;
  const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

  const existingIdx = data.quotationNumber
    ? (store.quotations || []).findIndex((q) => q.quotationNumber === data.quotationNumber)
    : -1;
  const quotationNumber = data.quotationNumber || generateReference('QTE');

  const record = {
    id: quotationNumber,
    quotationNumber,
    enquiryId: data.enquiryId || undefined,
    clientName: data.clientName,
    clientOrganisation: data.clientOrganisation,
    clientEmail: data.clientEmail,
    clientTelephone: data.clientTelephone || undefined,
    clientCountry: data.clientCountry || undefined,
    title: data.title,
    currency: data.currency,
    subtotal,
    discountPercent: data.discountPercent,
    discountAmount,
    taxPercent: data.taxPercent,
    taxAmount,
    totalAmount,
    status: data.status,
    validUntil: data.validUntil,
    paymentTerms: data.paymentTerms,
    notes: data.notes || undefined,
    preparedByName: 'DayTech Administrator',
    preparedByEmail: process.env.OFFICIAL_EMAIL?.trim() || 'sales@daytechsolutions.ug',
    createdByUid: 'server-admin',
    createdAt: existingIdx >= 0 ? store.quotations![existingIdx].createdAt : now,
    updatedAt: now,
    items: normalizedItems.map((it) => ({ ...it, quotationId: quotationNumber })),
  };

  if (!store.quotations) store.quotations = [];
  if (existingIdx >= 0) {
    store.quotations[existingIdx] = record;
  } else {
    store.quotations.unshift(record);
  }

  if (data.status === 'Sent' && data.enquiryId) {
    const enqIdx = store.enquiries.findIndex((e) => e.referenceNumber === data.enquiryId);
    if (enqIdx >= 0 && (store.enquiries[enqIdx].status === 'New' || store.enquiries[enqIdx].status === 'In Review')) {
      store.enquiries[enqIdx].status = 'Quotation Sent';
      store.enquiries[enqIdx].updatedAt = now;
    }
  }

  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: now,
    actor: 'Administrator',
    action: existingIdx >= 0 ? 'QUOTATION_UPDATED' : 'QUOTATION_CREATED',
    target: `${quotationNumber} (${data.clientOrganisation})`,
  });
  saveStore(store);

  return res.status(existingIdx >= 0 ? 200 : 201).json(record);
});

app.patch('/api/admin/quotations/:id', requireAdminAccess, (req, res) => {
  const statusSchema = z.object({
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']),
  });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid quotation status' });
  }

  const store = ensureStore();
  const idx = (store.quotations || []).findIndex((q) => q.quotationNumber === req.params.id || q.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  const now = new Date().toISOString();
  store.quotations![idx].status = parsed.data.status;
  store.quotations![idx].updatedAt = now;
  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: now,
    actor: 'Administrator',
    action: `QUOTATION_STATUS_${parsed.data.status.toUpperCase()}`,
    target: store.quotations![idx].quotationNumber,
  });
  saveStore(store);

  return res.json(store.quotations![idx]);
});

// SEO: robots.txt (disallow /admin and /portal)
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /portal',
      'Disallow: /api/',
      `Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
    ].join('\n')
  );
});

// SEO: XML Sitemap for public company pages
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const routes = [
    '/',
    '/about',
    '/services',
    '/services/software-development',
    '/services/it-infrastructure',
    '/services/ai-automation',
    '/services/cloud-hosting',
    '/services/web-digital',
    '/services/cybersecurity',
    '/services/it-consultancy',
    '/products',
    '/products/sacco',
    '/products/hr',
    '/products/hotelos',
    '/products/farm',
    '/products/crm',
    '/products/inventory',
    '/products/meet',
    '/products/finance',
    '/products/waterops',
    '/industries',
    '/portfolio',
    '/insights',
    '/contact',
    '/quote',
    '/demo',
    '/legal/privacy',
    '/legal/terms',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DayTech Solutions server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
