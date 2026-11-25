/**
 * Phase 2 Firestore Collection Registry & RBAC Role Definitions
 * Prepared for Firebase Authentication & Firestore Security Rules integration.
 */

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  userProfiles: 'userProfiles',
  organisations: 'organisations',
  roles: 'roles',
  permissions: 'permissions',
  services: 'services',
  products: 'products',
  productFeatures: 'productFeatures',
  productPlans: 'productPlans',
  industries: 'industries',
  portfolioProjects: 'portfolioProjects',
  caseStudies: 'caseStudies',
  blogPosts: 'blogPosts',
  enquiries: 'enquiries',
  demoBookings: 'demoBookings',
  customers: 'customers',
  quotations: 'quotations',
  quotationItems: 'quotationItems',
  projects: 'projects',
  projectMilestones: 'projectMilestones',
  subscriptions: 'subscriptions',
  invoices: 'invoices',
  payments: 'payments',
  supportTickets: 'supportTickets',
  ticketMessages: 'ticketMessages',
  notifications: 'notifications',
  documents: 'documents',
  websiteSettings: 'websiteSettings',
  auditLogs: 'auditLogs',
} as const;

export type DayTechRole =
  | 'super_admin'
  | 'admin'
  | 'content_manager'
  | 'sales_officer'
  | 'project_manager'
  | 'support_officer'
  | 'client';

export interface FirebaseUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: DayTechRole;
  organisationId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
