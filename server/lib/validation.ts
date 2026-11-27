import { z } from 'zod';

export const enquirySchema = z.object({
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

export const demoSchema = z.object({
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

export const contactSchema = z.object({
  referenceNumber: z.string().regex(/^DTC-[0-9]{4}-[A-Z0-9]{6}$/).optional(),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  organisation: z.string().trim().max(150).optional().default(''),
  email: z.string().trim().email('Valid email address is required').max(160),
  subject: z.string().trim().min(3, 'Subject is required').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
});

export const quotationLineSchema = z.object({
  itemType: z.enum(['Service', 'Software License', 'Implementation', 'Infrastructure', 'Support']),
  description: z.string().trim().min(2).max(240),
  details: z.string().trim().max(500).optional().default(''),
  unit: z.string().trim().min(1).max(40),
  quantity: z.number().finite().positive().max(100000),
  unitPrice: z.number().finite().min(0).max(10_000_000_000),
});

export const quotationPayloadSchema = z.object({
  quotationNumber: z.string().regex(/^QTE-[0-9]{4}-[A-Z0-9]{6}$/).optional(),
  enquiryId: z.union([z.literal(''), z.string().regex(/^DTQ-\d{4}-[A-Z0-9]{6}$/)]).optional().default(''),
  clientUid: z.string().trim().max(128).optional().default(''),
  clientName: z.string().trim().min(2).max(120),
  clientOrganisation: z.string().trim().min(2).max(150),
  clientEmail: z.string().trim().email().max(160),
  clientTelephone: z.string().trim().max(40).optional().default(''),
  clientCountry: z.string().trim().max(80).optional().default(''),
  title: z.string().trim().min(3).max(180),
  currency: z.enum(['UGX', 'USD', 'KES']).default('UGX'),
  discountPercent: z.number().finite().min(0).max(100).default(0),
  taxPercent: z.number().finite().min(0).max(100).default(18),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']).default('Draft'),
  validUntil: z.string().trim().min(8).max(40),
  paymentTerms: z.string().trim().min(2).max(600),
  notes: z.string().trim().max(2000).optional().default(''),
  items: z.array(quotationLineSchema).min(1).max(50),
  // Optional client-computed totals checked against server truth
  subtotal: z.number().finite().min(0).optional(),
  discountAmount: z.number().finite().min(0).optional(),
  taxAmount: z.number().finite().min(0).optional(),
  totalAmount: z.number().finite().min(0).optional(),
});

export const quotationShareLinkSchema = z.object({
  quotationNumber: z.string().regex(/^QTE-[0-9]{4}-[A-Z0-9]{6}$/),
  title: z.string().trim().min(3).max(180),
  clientOrganisation: z.string().trim().min(2).max(150),
  currency: z.enum(['UGX', 'USD', 'KES']),
  discountPercent: z.number().finite().min(0).max(100),
  taxPercent: z.number().finite().min(0).max(100),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']),
  validUntil: z.string().trim().min(8).max(40),
  paymentTerms: z.string().trim().min(2).max(600),
  notes: z.string().trim().max(2000).optional().default(''),
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
  items: z.array(quotationLineSchema).min(1).max(50),
});

export interface ComputedQuotationTotals {
  items: Array<{
    sortOrder: number;
    itemType: z.infer<typeof quotationLineSchema>['itemType'];
    description: string;
    details?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeValidatedQuotationTotals(
  items: Array<z.infer<typeof quotationLineSchema>>,
  discountPercent: number,
  taxPercent: number
): ComputedQuotationTotals {
  const safeDiscountPct = round2(Math.max(0, Math.min(100, discountPercent)));
  const safeTaxPct = round2(Math.max(0, Math.min(100, taxPercent)));

  const normalizedItems = items.map((item, idx) => {
    const qty = round2(Math.max(0.01, Math.min(100000, item.quantity)));
    const price = round2(Math.max(0, item.unitPrice));
    const lineTotal = round2(qty * price);
    return {
      sortOrder: idx,
      itemType: item.itemType,
      description: item.description.trim(),
      details: item.details?.trim() || undefined,
      unit: item.unit.trim(),
      quantity: qty,
      unitPrice: price,
      lineTotal,
    };
  });

  const subtotal = round2(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const discountAmount = round2(subtotal * (safeDiscountPct / 100));
  const taxableBase = round2(Math.max(0, subtotal - discountAmount));
  const taxAmount = round2(taxableBase * (safeTaxPct / 100));
  const totalAmount = round2(taxableBase + taxAmount);

  return {
    items: normalizedItems,
    subtotal,
    discountPercent: safeDiscountPct,
    discountAmount,
    taxPercent: safeTaxPct,
    taxAmount,
    totalAmount,
  };
}

export function verifyClientTotalsMatch(
  submitted: {
    subtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
  },
  computed: ComputedQuotationTotals
): { valid: boolean; mismatchField?: string } {
  const approxEqual = (a: number | undefined, b: number) =>
    a === undefined || Math.abs(a - b) <= 0.02;

  if (!approxEqual(submitted.subtotal, computed.subtotal)) {
    return { valid: false, mismatchField: 'subtotal' };
  }
  if (!approxEqual(submitted.discountAmount, computed.discountAmount)) {
    return { valid: false, mismatchField: 'discountAmount' };
  }
  if (!approxEqual(submitted.taxAmount, computed.taxAmount)) {
    return { valid: false, mismatchField: 'taxAmount' };
  }
  if (!approxEqual(submitted.totalAmount, computed.totalAmount)) {
    return { valid: false, mismatchField: 'totalAmount' };
  }
  return { valid: true };
}
