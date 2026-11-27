export const PRODUCT_STATUSES = [
  'Planned', 'In Development', 'Private Alpha', 'Public Beta', 'Available', 'Maintenance', 'Retired',
] as const;

export type ProductStatus = typeof PRODUCT_STATUSES[number];

export type CurrencyCode = 'UGX' | 'USD' | 'KES';

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceItem {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  summary: string;
  overview: string;
  iconName:
    | 'Code2'
    | 'Network'
    | 'Cpu'
    | 'Cloud'
    | 'Globe'
    | 'ShieldCheck'
    | 'Compass';
  features: string[];
  benefits: string[];
  targetCustomers: string[];
  implementationApproach: {
    step: string;
    detail: string;
  }[];
  faqs: ServiceFAQ[];
}

export interface ProductPlan {
  name: string;
  audience: string;
  cadence: string;
  prices: Record<CurrencyCode, number | null>;
  limits: string[];
  highlighted?: boolean;
}

export interface ProductPreviewMetric {
  label: string;
  value: string;
  context: string;
}

export interface ProductPreviewRow {
  primary: string;
  secondary: string;
  metric: string;
  state: string;
}

export interface ProductItem {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: ProductStatus;
  externalAppUrl: string | null;
  overview: string;
  problemStatement: string;
  proposedSolution: string;
  capabilities: string[];
  benefits: string[];
  targetCustomers: string[];
  plans: ProductPlan[];
  faqs: ServiceFAQ[];
  relatedSlugs: string[];
  previewData: {
    moduleTabs: {
      id: string;
      label: string;
      metrics: ProductPreviewMetric[];
      columns: [string, string, string, string];
      rows: ProductPreviewRow[];
    }[];
  };
}

export interface IndustryItem {
  slug: string;
  name: string;
  summary: string;
  operationalNeeds: string[];
  daytechApproach: string;
  recommendedServiceSlugs: string[];
  recommendedProductSlugs: string[];
  complianceFocus: string;
}

export interface InsightArticle {
  slug: string;
  title: string;
  category: string;
  publishedLabel: string;
  readTime: string;
  summary: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

export interface ReferenceArchitecture {
  id: string;
  title: string;
  domain: string;
  summary: string;
  stack: string[];
  outcomes: string[];
}

export interface EnquiryRecord {
  id: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: 'New' | 'In Review' | 'Quotation Sent' | 'Converted' | 'Archived';
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
  preferredContactMethod: string;
  consentAccepted: boolean;
  submitterUid?: string;
  internalNotes?: string;
}

export interface DemoBookingRecord {
  id: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: 'Pending' | 'Confirmed' | 'Rescheduled' | 'Declined';
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
  submitterUid?: string;
}

export interface ContactMessageRecord {
  id: string;
  referenceNumber: string;
  createdAt: string;
  fullName: string;
  organisation: string;
  email: string;
  subject: string;
  message: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
}

export interface SupportTicketRecord {
  id: string;
  ownerUid: string;
  organisationName: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Awaiting Client' | 'Resolved' | 'Closed';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProjectRecord {
  id: string;
  ownerUid: string;
  organisationName: string;
  title: string;
  stage: 'Discovery' | 'Planning' | 'Design' | 'Development' | 'Testing' | 'Deployment' | 'Support';
  progressPercent: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccountRecord {
  uid: string;
  displayName: string;
  organisationName?: string;
  role:
    | 'super_admin'
    | 'admin'
    | 'content_manager'
    | 'sales_officer'
    | 'project_manager'
    | 'support_officer'
    | 'client';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuotationItemType =
  | 'Service'
  | 'Software License'
  | 'Implementation'
  | 'Infrastructure'
  | 'Support';

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';

export interface QuotationItemRecord {
  id: string;
  quotationId: string;
  clientUid?: string;
  sortOrder: number;
  itemType: QuotationItemType;
  description: string;
  details?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
}

export interface QuotationRecord {
  id: string;
  quotationNumber: string;
  enquiryId?: string;
  clientUid?: string;
  clientName: string;
  clientOrganisation: string;
  clientEmail: string;
  clientTelephone?: string;
  clientCountry?: string;
  title: string;
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
  preparedByName: string;
  preparedByEmail: string;
  createdByUid: string;
  createdAt: string;
  updatedAt: string;
  items?: QuotationItemRecord[];
}

export interface PublicConfig {
  defaultCurrency: CurrencyCode;
  defaultTimezone: string;
  officialEmail: string | null;
  officialPhone: string | null;
  officialWhatsApp: string | null;
  officialAddress: string | null;
  features: {
    firebaseEnabled: boolean;
    paymentsEnabled: boolean;
    googleCalendarEnabled: boolean;
    whatsappEnabled: boolean;
  };
  storage?: {
    persistent: boolean;
    provider: 'local-file-store' | 'firestore' | 'firestore+local' | 'unavailable';
    note: string;
  };
}
