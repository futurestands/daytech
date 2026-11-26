import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  getServerFirebaseConfig,
  getStorageStatus,
  isFirebaseFeatureEnabledServer,
  isServerlessRuntime,
  normalizeCurrency,
  normalizeTimezone,
  parseBooleanFlag,
} from './lib/config';
import {
  ALL_STAFF_ROLES,
  AdminAuthDeps,
  evaluateAdminRequest,
} from './lib/adminAuth';
import {
  fetchFirestoreDocAsCaller,
  verifyFirebaseIdToken,
  VerifiedFirebaseToken,
} from './lib/firebaseAuth';
import {
  getQuotationSigningSecret,
  mintQuotationShareToken,
  verifyQuotationShareToken,
} from './lib/quotationTokens';
import {
  canUseLocalJsonStore,
  ensureLocalStore,
  generateReference,
  saveLocalStore,
} from './lib/storage';
import {
  computeValidatedQuotationTotals,
  contactSchema,
  demoSchema,
  enquirySchema,
  quotationPayloadSchema,
  quotationShareLinkSchema,
  verifyClientTotalsMatch,
} from './lib/validation';

export interface ApiAppDeps {
  adminAuthDeps?: AdminAuthDeps;
  verifyClientToken?: (token: string) => Promise<VerifiedFirebaseToken>;
  fetchFirestoreDoc?: (
    idToken: string,
    collectionPath: string,
    docId: string
  ) => Promise<Record<string, unknown> | null>;
  env?: NodeJS.ProcessEnv;
}

const PUBLIC_SITEMAP_ROUTES = [
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

function sanitizeEnquiryLookup(doc: Record<string, unknown>) {
  return {
    type: 'Quotation Enquiry',
    referenceNumber: String(doc.referenceNumber || ''),
    status: String(doc.status || 'New'),
    organisation: String(doc.organisation || ''),
    service: String(doc.requiredService || ''),
    product: doc.interestedProduct ? String(doc.interestedProduct) : undefined,
    currency: doc.currency ? String(doc.currency) : undefined,
    createdAt: String(doc.createdAt || ''),
    updatedAt: String(doc.updatedAt || ''),
  };
}

function sanitizeDemoLookup(doc: Record<string, unknown>) {
  return {
    type: 'Product Demonstration',
    referenceNumber: String(doc.referenceNumber || ''),
    status: String(doc.status || 'Pending'),
    organisation: String(doc.organisation || ''),
    product: String(doc.productName || ''),
    preferredDate: String(doc.preferredDate || ''),
    preferredTime: String(doc.preferredTime || ''),
    timezone: String(doc.timezone || 'Africa/Kampala'),
    createdAt: String(doc.createdAt || ''),
    updatedAt: String(doc.updatedAt || ''),
  };
}

function sanitizeQuotationLookup(doc: Record<string, unknown>) {
  return {
    type: 'Formal Quotation',
    referenceNumber: String(doc.quotationNumber || doc.id || ''),
    status: String(doc.status || 'Sent'),
    organisation: String(doc.clientOrganisation || ''),
    service: String(doc.title || ''),
    currency: String(doc.currency || 'UGX'),
    totalAmount: Number(doc.totalAmount ?? 0),
    validUntil: String(doc.validUntil || ''),
    createdAt: String(doc.createdAt || ''),
    updatedAt: String(doc.updatedAt || ''),
    quotation: {
      id: String(doc.id || doc.quotationNumber || ''),
      quotationNumber: String(doc.quotationNumber || ''),
      clientOrganisation: String(doc.clientOrganisation || ''),
      title: String(doc.title || ''),
      currency: String(doc.currency || 'UGX'),
      subtotal: Number(doc.subtotal ?? 0),
      discountPercent: Number(doc.discountPercent ?? 0),
      discountAmount: Number(doc.discountAmount ?? 0),
      taxPercent: Number(doc.taxPercent ?? 0),
      taxAmount: Number(doc.taxAmount ?? 0),
      totalAmount: Number(doc.totalAmount ?? 0),
      status: String(doc.status || 'Sent'),
      validUntil: String(doc.validUntil || ''),
      paymentTerms: String(doc.paymentTerms || ''),
      notes: doc.notes ? String(doc.notes) : undefined,
      items: Array.isArray(doc.items) ? doc.items : undefined,
    },
  };
}

export function createApiApp(deps: ApiAppDeps = {}) {
  const app = express();
  const env = deps.env ?? process.env;

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  app.use(express.json({ limit: '200kb' }));

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

  function adminGuard(allowedRoles: readonly string[] = ALL_STAFF_ROLES) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const result = await evaluateAdminRequest(req, allowedRoles, deps.adminAuthDeps ?? { env });
      if (!result.authorized) {
        return res.status(result.statusCode).json({
          error: result.error,
          requiresAuth: true,
        });
      }
      (req as Request & { adminContext?: typeof result }).adminContext = result;
      return next();
    };
  }

  app.get('/api/health', (_req, res) => {
    const storage = getStorageStatus(env);
    const fbCfg = getServerFirebaseConfig(env);
    res.json({
      status: 'ok',
      runtime: isServerlessRuntime(env) ? 'vercel-serverless' : 'node-express',
      firebaseProjectId: fbCfg.projectId,
      storage,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/public-config', (_req, res) => {
    const whatsappNumber = env.OFFICIAL_WHATSAPP_NUMBER?.trim() || null;
    const firebaseFlag = isFirebaseFeatureEnabledServer(env);
    const paymentsFlag = parseBooleanFlag(env.VITE_FEATURE_PAYMENTS, false);
    const calendarFlag = parseBooleanFlag(env.VITE_FEATURE_GOOGLE_CALENDAR, false);
    const whatsappFlag = parseBooleanFlag(env.VITE_FEATURE_WHATSAPP, false);

    res.json({
      defaultCurrency: normalizeCurrency(env.DEFAULT_CURRENCY),
      defaultTimezone: normalizeTimezone(env.DEFAULT_TIMEZONE),
      officialEmail: env.OFFICIAL_EMAIL?.trim() || null,
      officialPhone: env.OFFICIAL_PHONE?.trim() || null,
      officialWhatsApp: whatsappFlag && whatsappNumber ? whatsappNumber : null,
      officialAddress: env.OFFICIAL_ADDRESS?.trim() || null,
      features: {
        firebaseEnabled: firebaseFlag,
        paymentsEnabled: paymentsFlag,
        googleCalendarEnabled: calendarFlag,
        whatsappEnabled: Boolean(whatsappFlag && whatsappNumber),
      },
      storage: getStorageStatus(env),
    });
  });

  // Trusted quotation financial validation endpoint
  app.post('/api/quotations/validate', (req, res) => {
    const parsed = quotationPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const computed = computeValidatedQuotationTotals(
      parsed.data.items,
      parsed.data.discountPercent,
      parsed.data.taxPercent
    );
    const integrity = verifyClientTotalsMatch(parsed.data, computed);
    if (!integrity.valid) {
      return res.status(400).json({
        error: `Quotation financial integrity mismatch on ${integrity.mismatchField}.`,
        computed,
      });
    }
    return res.json({
      valid: true,
      computed,
    });
  });

  // Public Lead & Enquiry Submission (only persists in durable storage; never uses local JSON on serverless)
  app.post('/api/enquiries', rateLimit(20, 60_000), (req, res) => {
    if (!canUseLocalJsonStore(env)) {
      const storage = getStorageStatus(env);
      return res.status(503).json({
        error: storage.persistent
          ? 'Submit directly through the Cloud Firestore client workflow in serverless mode.'
          : storage.note,
        storageUnavailable: !storage.persistent,
      });
    }

    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const store = ensureLocalStore();
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
      saveLocalStore(store);
      return res.status(201).json({
        referenceNumber: record.referenceNumber,
        createdAt: record.createdAt,
        status: record.status,
      });
    } catch (err) {
      console.error('Failed to persist enquiry:', err);
      return res.status(500).json({ error: 'Unable to persist enquiry in storage.' });
    }
  });

  app.post('/api/demos', rateLimit(20, 60_000), (req, res) => {
    if (!canUseLocalJsonStore(env)) {
      const storage = getStorageStatus(env);
      return res.status(503).json({
        error: storage.persistent
          ? 'Submit directly through the Cloud Firestore client workflow in serverless mode.'
          : storage.note,
        storageUnavailable: !storage.persistent,
      });
    }

    const parsed = demoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const store = ensureLocalStore();
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
      saveLocalStore(store);
      return res.status(201).json({
        referenceNumber: record.referenceNumber,
        createdAt: record.createdAt,
        status: record.status,
        timezone: record.timezone,
      });
    } catch (err) {
      console.error('Failed to persist demo booking:', err);
      return res.status(500).json({ error: 'Unable to persist demonstration request.' });
    }
  });

  app.post('/api/contact', rateLimit(20, 60_000), (req, res) => {
    if (!canUseLocalJsonStore(env)) {
      const storage = getStorageStatus(env);
      return res.status(503).json({
        error: storage.persistent
          ? 'Submit directly through the Cloud Firestore client workflow in serverless mode.'
          : storage.note,
        storageUnavailable: !storage.persistent,
      });
    }

    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const store = ensureLocalStore();
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
      saveLocalStore(store);
      return res.status(201).json({
        referenceNumber: record.referenceNumber,
        createdAt: record.createdAt,
      });
    } catch (err) {
      console.error('Failed to persist contact message:', err);
      return res.status(500).json({ error: 'Unable to persist contact message.' });
    }
  });

  // Secured Client Portal lookup:
  // ONLY permits:
  // 1. Valid HMAC-SHA256 signed expiring share token (?token=...) -> returns redacted customer-safe DTO
  // 2. Authenticated Firebase caller (Authorization: Bearer <idToken> + ?ref=...) -> returns caller-owned sanitized summary
  app.get('/api/portal/lookup', rateLimit(30, 60_000), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    const shareToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    if (shareToken) {
      const { secret } = getQuotationSigningSecret(env);
      if (!secret) {
        return res.status(503).json({
          error: 'Signed quotation link verification secret is not configured on the server.',
        });
      }
      const verified = verifyQuotationShareToken(shareToken, { secret });
      if (!verified.valid) {
        return res.status(401).json({ error: verified.reason });
      }
      const q = verified.payload.q;
      return res.json({
        type: 'Formal Quotation',
        referenceNumber: q.quotationNumber,
        status: q.status,
        organisation: q.clientOrganisation,
        service: q.title,
        currency: q.currency,
        totalAmount: q.totalAmount,
        validUntil: q.validUntil,
        signedTokenValid: true,
        expiresAt: new Date(verified.payload.exp * 1000).toISOString(),
        quotation: {
          id: q.quotationNumber,
          quotationNumber: q.quotationNumber,
          clientOrganisation: q.clientOrganisation,
          title: q.title,
          currency: q.currency,
          subtotal: q.subtotal,
          discountPercent: q.discountPercent,
          discountAmount: q.discountAmount,
          taxPercent: q.taxPercent,
          taxAmount: q.taxAmount,
          totalAmount: q.totalAmount,
          status: q.status,
          validUntil: q.validUntil,
          paymentTerms: q.paymentTerms,
          notes: q.notes,
          items: q.items.map((it, idx) => ({
            id: `item-${idx + 1}`,
            quotationId: q.quotationNumber,
            ...it,
          })),
        },
        createdAt: new Date(verified.payload.iat * 1000).toISOString(),
        updatedAt: new Date(verified.payload.iat * 1000).toISOString(),
      });
    }

    const authHeader =
      typeof req.headers.authorization === 'string' ? req.headers.authorization.trim() : '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error:
          'Authentication or a valid signed quotation link is required. Sign in with Google in the Client Portal or open your expiring quotation link.',
      });
    }

    const idToken = authHeader.slice(7).trim();
    const ref = String(req.query.ref || '').trim().toUpperCase();
    if (!ref || !/^(DTQ|DTD|QTE)-[0-9]{4}-[A-Z0-9]{6}$/.test(ref)) {
      return res.status(400).json({ error: 'Valid reference number (DTQ/DTD/QTE) is required.' });
    }

    let decoded: VerifiedFirebaseToken;
    try {
      const verifyFn = deps.verifyClientToken ?? ((t) => verifyFirebaseIdToken(t));
      decoded = await verifyFn(idToken);
      if (!decoded.emailVerified) {
        return res.status(403).json({ error: 'Verified email address required for lookup.' });
      }
    } catch (err) {
      return res.status(401).json({
        error: err instanceof Error ? err.message : 'Invalid Firebase authentication token.',
      });
    }

    const fetchDocFn = deps.fetchFirestoreDoc ?? fetchFirestoreDocAsCaller;
    try {
      const account = await fetchDocFn(idToken, 'users', decoded.uid);
      if (account?.active !== true) {
        return res.status(403).json({ error: 'An active customer account is required.' });
      }

      if (ref.startsWith('DTQ-')) {
        const enquiry = await fetchDocFn(idToken, 'enquiries', ref);
        if (enquiry?.submitterUid === decoded.uid) return res.json(sanitizeEnquiryLookup(enquiry));
      } else if (ref.startsWith('DTD-')) {
        const demo = await fetchDocFn(idToken, 'demoBookings', ref);
        if (demo?.submitterUid === decoded.uid) return res.json(sanitizeDemoLookup(demo));
      } else {
        const quotation = await fetchDocFn(idToken, 'quotations', ref);
        if (quotation?.clientUid === decoded.uid) return res.json(sanitizeQuotationLookup(quotation));
      }
    } catch {
      return res.status(503).json({ error: 'Reference lookup is temporarily unavailable.' });
    }

    return res.status(404).json({
      error: 'No authorised record found for your authenticated account and reference number.',
    });
  });

  // Staff endpoint to mint signed, expiring customer quotation links
  app.post(
    '/api/admin/quotations/share-link',
    adminGuard(['super_admin', 'admin', 'sales_officer']),
    (req, res) => {
      const parsed = quotationShareLinkSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid quotation share link request.',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { secret, ephemeral } = getQuotationSigningSecret(env);
      if (!secret) {
        return res.status(503).json({
          error:
            'QUOTATION_LINK_SECRET must contain at least 32 characters and be configured in server environment variables to sign customer quotation links in production.',
        });
      }

      const minted = mintQuotationShareToken(parsed.data, { secret });
      const host = req.get('host');
      const origin = (env.APP_URL || (host ? `${req.protocol}://${host}` : '')).replace(/\/$/, '');
      const relativeUrl = `/portal?token=${encodeURIComponent(minted.token)}`;

      return res.status(201).json({
        token: minted.token,
        tokenId: minted.tokenId,
        expiresAt: minted.expiresAt,
        relativeUrl,
        shareUrl: origin ? `${origin}${relativeUrl}` : relativeUrl,
        ephemeralSecretUsed: ephemeral,
      });
    }
  );

  // Admin Overview & Operations API
  app.get('/api/admin/overview', adminGuard(['super_admin', 'admin']), (req, res) => {
    const storage = getStorageStatus(env);
    const adminCtx = (req as Request & { adminContext?: { mode: string; role?: string } })
      .adminContext;

    if (!canUseLocalJsonStore(env)) {
      return res.status(503).json({
        error: 'Server overview storage is unavailable. Use the Firestore staff dashboard.',
        storage,
      });
    }

    const store = ensureLocalStore();
    return res.json({
      adminAuthMode: adminCtx?.mode || 'firebase-rbac',
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

  app.patch(
    '/api/admin/enquiries/:id',
    adminGuard(['super_admin', 'admin', 'sales_officer']),
    (req, res) => {
      if (!canUseLocalJsonStore(env)) {
        return res.status(503).json({
          error: 'Local store disabled in serverless mode. Perform updates through Cloud Firestore.',
        });
      }
      const statusSchema = z.object({
        status: z.enum(['New', 'In Review', 'Quotation Sent', 'Converted', 'Archived']),
        internalNotes: z.string().max(1500).optional(),
      });
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid status update' });
      }

      const store = ensureLocalStore();
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
      saveLocalStore(store);

      return res.json(store.enquiries[idx]);
    }
  );

  app.patch(
    '/api/admin/demos/:id',
    adminGuard(['super_admin', 'admin', 'sales_officer']),
    (req, res) => {
      if (!canUseLocalJsonStore(env)) {
        return res.status(503).json({
          error: 'Local store disabled in serverless mode. Perform updates through Cloud Firestore.',
        });
      }
      const demoStatusSchema = z.object({
        status: z.enum(['Pending', 'Confirmed', 'Rescheduled', 'Declined']),
      });
      const parsed = demoStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid demonstration status' });
      }

      const store = ensureLocalStore();
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
      saveLocalStore(store);

      return res.json(store.demos[idx]);
    }
  );

  app.post(
    '/api/admin/quotations',
    adminGuard(['super_admin', 'admin', 'sales_officer']),
    (req, res) => {
      if (!canUseLocalJsonStore(env)) {
        return res.status(503).json({
          error: 'Local store disabled in serverless mode. Save quotations directly to Cloud Firestore.',
        });
      }
      const parsed = quotationPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid quotation details',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const computed = computeValidatedQuotationTotals(
        data.items,
        data.discountPercent,
        data.taxPercent
      );
      const integrity = verifyClientTotalsMatch(data, computed);
      if (!integrity.valid) {
        return res.status(400).json({
          error: `Quotation total mismatch on ${integrity.mismatchField}; server recalculated totals enforced.`,
        });
      }

      const store = ensureLocalStore();
      const now = new Date().toISOString();
      const existingIdx = data.quotationNumber
        ? (store.quotations || []).findIndex((q) => q.quotationNumber === data.quotationNumber)
        : -1;
      const quotationNumber = data.quotationNumber || generateReference('QTE');

      const record = {
        id: quotationNumber,
        quotationNumber,
        enquiryId: data.enquiryId || undefined,
        clientUid: data.clientUid || undefined,
        clientName: data.clientName,
        clientOrganisation: data.clientOrganisation,
        clientEmail: data.clientEmail,
        clientTelephone: data.clientTelephone || undefined,
        clientCountry: data.clientCountry || undefined,
        title: data.title,
        currency: data.currency,
        subtotal: computed.subtotal,
        discountPercent: computed.discountPercent,
        discountAmount: computed.discountAmount,
        taxPercent: computed.taxPercent,
        taxAmount: computed.taxAmount,
        totalAmount: computed.totalAmount,
        status: data.status,
        validUntil: data.validUntil,
        paymentTerms: data.paymentTerms,
        notes: data.notes || undefined,
        preparedByName: 'DayTech Sales Desk',
        preparedByEmail: env.OFFICIAL_EMAIL?.trim() || 'sales@daytechsolutions.ug',
        createdByUid: 'server-admin',
        createdAt: existingIdx >= 0 ? store.quotations![existingIdx].createdAt : now,
        updatedAt: now,
        items: computed.items.map((it, idx) => ({
          id: `item-${idx + 1}`,
          quotationId: quotationNumber,
          createdAt: now,
          ...it,
        })),
      };

      if (!store.quotations) store.quotations = [];
      if (existingIdx >= 0) {
        store.quotations[existingIdx] = record;
      } else {
        store.quotations.unshift(record);
      }

      if (data.status === 'Sent' && data.enquiryId) {
        const enqIdx = store.enquiries.findIndex((e) => e.referenceNumber === data.enquiryId);
        if (
          enqIdx >= 0 &&
          (store.enquiries[enqIdx].status === 'New' || store.enquiries[enqIdx].status === 'In Review')
        ) {
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
      saveLocalStore(store);

      return res.status(existingIdx >= 0 ? 200 : 201).json(record);
    }
  );

  app.patch(
    '/api/admin/quotations/:id',
    adminGuard(['super_admin', 'admin', 'sales_officer']),
    (req, res) => {
      if (!canUseLocalJsonStore(env)) {
        return res.status(503).json({
          error: 'Local store disabled in serverless mode. Update quotations directly in Cloud Firestore.',
        });
      }
      const statusSchema = z.object({
        status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']),
      });
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid quotation status' });
      }

      const store = ensureLocalStore();
      const idx = (store.quotations || []).findIndex(
        (q) => q.quotationNumber === req.params.id || q.id === req.params.id
      );
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
      saveLocalStore(store);

      return res.json(store.quotations![idx]);
    }
  );

  const sendRobotsTxt = (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = (env.APP_URL || `${req.protocol}://${host}`).replace(/\/$/, '');
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /portal',
        'Disallow: /api/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n')
    );
  };

  const sendSitemapXml = (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = (env.APP_URL || `${req.protocol}://${host}`).replace(/\/$/, '');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_SITEMAP_ROUTES.map(
  (route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
  </url>`
).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  };

  app.get('/robots.txt', sendRobotsTxt);
  app.get('/api/robots', sendRobotsTxt);
  app.get('/sitemap.xml', sendSitemapXml);
  app.get('/api/sitemap', sendSitemapXml);

  return app;
}
