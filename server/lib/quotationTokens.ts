import crypto from 'crypto';
import { CurrencyCode, QuotationItemType, QuotationStatus } from '../../src/types/domain';
import { isServerlessRuntime } from './config';
import { computeValidatedQuotationTotals, quotationShareLinkSchema } from './validation';
import { z } from 'zod';

let ephemeralDevSecret: string | null = null;

export function getQuotationSigningSecret(env: NodeJS.ProcessEnv = process.env): {
  secret: string | null;
  ephemeral: boolean;
} {
  const configured =
    env.QUOTATION_LINK_SECRET?.trim() || env.ADMIN_ACCESS_KEY?.trim() || '';
  if (configured.length >= 16) {
    return { secret: configured, ephemeral: false };
  }
  if (env.NODE_ENV === 'production' || isServerlessRuntime(env)) {
    return { secret: null, ephemeral: false };
  }
  if (!ephemeralDevSecret) {
    ephemeralDevSecret = crypto.randomBytes(32).toString('hex');
  }
  return { secret: ephemeralDevSecret, ephemeral: true };
}

export interface SignedQuotationSharePayload {
  v: 1;
  typ: 'quotation_share';
  jti: string;
  iat: number;
  exp: number;
  q: {
    quotationNumber: string;
    title: string;
    clientOrganisation: string;
    currency: CurrencyCode;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
    status: QuotationStatus;
    validUntil: string;
    paymentTerms: string;
    notes?: string;
    items: Array<{
      sortOrder: number;
      itemType: QuotationItemType;
      description: string;
      details?: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  };
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signData(encodedPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function mintQuotationShareToken(
  input: z.infer<typeof quotationShareLinkSchema>,
  options: { secret: string; nowSeconds?: number }
): { token: string; tokenId: string; expiresAt: string; payload: SignedQuotationSharePayload } {
  const parsed = quotationShareLinkSchema.parse(input);
  const totals = computeValidatedQuotationTotals(
    parsed.items,
    parsed.discountPercent,
    parsed.taxPercent
  );
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttlSeconds = Math.max(3600, Math.min(30 * 86400, parsed.expiresInDays * 86400));
  const exp = nowSeconds + ttlSeconds;
  const jti = crypto.randomBytes(12).toString('hex');

  const payload: SignedQuotationSharePayload = {
    v: 1,
    typ: 'quotation_share',
    jti,
    iat: nowSeconds,
    exp,
    q: {
      quotationNumber: parsed.quotationNumber,
      title: parsed.title,
      clientOrganisation: parsed.clientOrganisation,
      currency: parsed.currency,
      subtotal: totals.subtotal,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      taxPercent: totals.taxPercent,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: parsed.status,
      validUntil: parsed.validUntil,
      paymentTerms: parsed.paymentTerms,
      notes: parsed.notes || undefined,
      items: totals.items,
    },
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  const sig = signData(encoded, options.secret);
  return {
    token: `${encoded}.${sig}`,
    tokenId: jti,
    expiresAt: new Date(exp * 1000).toISOString(),
    payload,
  };
}

export function verifyQuotationShareToken(
  token: string,
  options: { secret: string; nowSeconds?: number }
): { valid: true; payload: SignedQuotationSharePayload } | { valid: false; reason: string } {
  const trimmed = token.trim();
  const dotIdx = trimmed.indexOf('.');
  if (dotIdx <= 0 || dotIdx === trimmed.length - 1) {
    return { valid: false, reason: 'Malformed quotation link token.' };
  }

  const encoded = trimmed.slice(0, dotIdx);
  const providedSig = trimmed.slice(dotIdx + 1);
  if (!encoded || !providedSig) {
    return { valid: false, reason: 'Incomplete quotation link token.' };
  }

  const expectedSig = signData(encoded, options.secret);
  if (!timingSafeMatch(providedSig, expectedSig)) {
    return { valid: false, reason: 'Invalid quotation link signature.' };
  }

  let parsed: SignedQuotationSharePayload;
  try {
    parsed = JSON.parse(fromBase64Url(encoded)) as SignedQuotationSharePayload;
  } catch {
    return { valid: false, reason: 'Corrupted quotation link payload.' };
  }

  if (
    parsed?.v !== 1 ||
    parsed?.typ !== 'quotation_share' ||
    typeof parsed.exp !== 'number' ||
    !parsed.q?.quotationNumber
  ) {
    return { valid: false, reason: 'Unsupported quotation link format.' };
  }

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (nowSeconds >= parsed.exp) {
    return { valid: false, reason: 'This quotation link has expired. Request a refreshed link from DayTech Solutions.' };
  }

  return { valid: true, payload: parsed };
}
