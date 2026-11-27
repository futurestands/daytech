import { ProductPublishingPanel } from '../components/ProductPublishingPanel';
import { GrowthLeadPanel } from '../components/GrowthLeadPanel';
import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  Download,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Plus,
  Printer,
  Settings,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { SEOHead } from '../components/SEOHead';
import { QuotationDocument } from '../components/QuotationDocument';
import { formatCurrencyValue, PRODUCTS } from '../data/products';
import { SERVICES } from '../data/services';
import { INDUSTRIES } from '../data/industries';
import {
  AuditLogRecord,
  ClientProjectRecord,
  ContactMessageRecord,
  CurrencyCode,
  DemoBookingRecord,
  EnquiryRecord,
  QuotationItemRecord,
  QuotationItemType,
  QuotationRecord,
  QuotationStatus,
  SupportTicketRecord,
  UserAccountRecord,
} from '../types/domain';
import { useAppContext } from '../context/AppContext';
import { FirebaseProvider, useFirebase } from '../context/FirebaseContext';
import { db } from '../lib/firebase/client';
import {
  computeQuotationTotals,
  createProjectInFirestore,
  fetchQuotationItemsFromFirestore,
  QuotationLineInput,
  saveQuotationInFirestore,
  toIsoString,
  updateDemoInFirestore,
  updateEnquiryInFirestore,
  updateProjectInFirestore,
  updateQuotationStatusInFirestore,
  updateSupportTicketInFirestore,
  updateUserAccountInFirestore,
} from '../lib/firebase/firestoreService';

type AdminTab =
  | 'dashboard'
  | 'enquiries'
  | 'quotations'
  | 'demos'
  | 'growth'
  | 'contacts'
  | 'content'
  | 'operations'
  | 'audit'
  | 'settings';

interface AdminOverviewResponse {
  adminAuthMode: string;
  stats: {
    totalEnquiries: number;
    pendingQuotations: number;
    demoRequests: number;
    pendingDemos: number;
    contactMessages: number;
  };
  enquiries: EnquiryRecord[];
  demos: DemoBookingRecord[];
  contacts?: ContactMessageRecord[];
  quotations?: QuotationRecord[];
  auditLogs: AuditLogRecord[];
}

function defaultValidUntilDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_PAYMENT_TERMS =
  '50% mobilization deposit upon quotation acceptance, 30% upon UAT sign-off, and 20% upon production deployment.';

export function AdminPage() {
  return <FirebaseProvider><AuthenticatedAdmin /></FirebaseProvider>;
}

function AuthenticatedAdmin() {
  const { user } = useFirebase();
  return <AdminSession key={user?.uid ?? 'guest'} />;
}

function AdminSession() {
  const { publicConfig } = useAppContext();
  const {
    firebaseReady,
    authReady,
    user,
    userAccount,
    isStaff,
    isAdmin,
    authError,
    signingIn,
    signInWithGoogle,
    signOutUser,
  } = useFirebase();

  const [requestedTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [adminToken, setAdminToken] = useState('');
  const [serverUnlocked, setServerUnlocked] = useState(false);
  const [loadingServer, setLoadingServer] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [collectionStatus, setCollectionStatus] = useState<Record<string, string>>({});
  const [serverData, setServerData] = useState<AdminOverviewResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Live Firestore Admin collections (attached ONLY when authReady && isStaff)
  const [fsEnquiries, setFsEnquiries] = useState<EnquiryRecord[]>([]);
  const [fsDemos, setFsDemos] = useState<DemoBookingRecord[]>([]);
  const [fsContacts, setFsContacts] = useState<ContactMessageRecord[]>([]);
  const [fsTickets, setFsTickets] = useState<SupportTicketRecord[]>([]);
  const [fsProjects, setFsProjects] = useState<ClientProjectRecord[]>([]);
  const [fsUsers, setFsUsers] = useState<UserAccountRecord[]>([]);
  const [fsQuotations, setFsQuotations] = useState<QuotationRecord[]>([]);
  const [fsAuditLogs, setFsAuditLogs] = useState<AuditLogRecord[]>([]);

  // Quotation Builder & PDF Preview state
  const [editingQuotationNumber, setEditingQuotationNumber] = useState<string | null>(null);
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [quotePresetKey, setQuotePresetKey] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    enquiryId: '',
    clientUid: '',
    clientName: '',
    clientOrganisation: '',
    clientEmail: '',
    clientTelephone: '',
    clientCountry: 'Uganda',
    title: '',
    currency: 'UGX' as CurrencyCode,
    discountPercent: 0,
    taxPercent: 18,
    validUntil: defaultValidUntilDate(),
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    notes: 'Includes deployment documentation, administrator onboarding, and standard UAT verification.',
  });
  const [quoteItems, setQuoteItems] = useState<QuotationLineInput[]>([
    {
      itemType: 'Service',
      description: 'Discovery, System Architecture & Core Implementation',
      details: '',
      unit: 'Project',
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  const [previewDoc, setPreviewDoc] = useState<{
    quotation: QuotationRecord;
    items: QuotationItemRecord[];
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // New project form state
  const [newProject, setNewProject] = useState({
    ownerUid: '',
    organisationName: '',
    title: '',
    stage: 'Discovery' as ClientProjectRecord['stage'],
    progressPercent: 10,
    summary: '',
  });

  const usingFirestoreAdmin = Boolean(firebaseReady && authReady && isStaff && db);

  const role = userAccount?.role;
  const canSell = isAdmin || role === 'sales_officer';
  const canSupport = isAdmin || role === 'support_officer';
  const canManageProjects = isAdmin || role === 'project_manager';
  const allowedTabs: AdminTab[] = ['dashboard'];
  if (canSell) allowedTabs.push('growth');
  if (canSell || serverUnlocked) allowedTabs.push('enquiries', 'quotations', 'demos');
  if (canSell || canSupport || serverUnlocked) allowedTabs.push('contacts');
  if (canSupport || canManageProjects) allowedTabs.push('operations');
  if (isAdmin || role === 'content_manager') allowedTabs.push('content');
  if (isAdmin || serverUnlocked) allowedTabs.push('audit', 'settings');
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : 'dashboard';

  useEffect(() => {
    setCollectionStatus({});
    setFsEnquiries([]);
    setFsDemos([]);
    setFsContacts([]);
    setFsTickets([]);
    setFsProjects([]);
    setFsUsers([]);
    setFsQuotations([]);
    setFsAuditLogs([]);
    if (!usingFirestoreAdmin) return;

    function updateStatus(collectionName: string, status: string) {
      setCollectionStatus(previous => ({ ...previous, [collectionName]: status }));
    }

    const unsubEnquiries = canSell ? onSnapshot(
      collection(db, 'enquiries'),
      { includeMetadataChanges: true },
      (snap) => {
        updateStatus('enquiries', snap.metadata.fromCache ? 'loading' : 'ready');
        const rows: EnquiryRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            referenceNumber: String(r.referenceNumber || d.id),
            createdAt: toIsoString(r.createdAt),
            updatedAt: toIsoString(r.updatedAt),
            status: r.status as EnquiryRecord['status'],
            fullName: String(r.fullName || ''),
            organisation: String(r.organisation || ''),
            email: String(r.email || ''),
            telephone: String(r.telephone || ''),
            country: String(r.country || ''),
            industry: String(r.industry || ''),
            requiredService: String(r.requiredService || ''),
            interestedProduct: String(r.interestedProduct || ''),
            projectDescription: String(r.projectDescription || ''),
            budgetRange: String(r.budgetRange || ''),
            currency: r.currency as EnquiryRecord['currency'],
            timeline: String(r.timeline || ''),
            preferredContactMethod: String(r.preferredContactMethod || ''),
            consentAccepted: Boolean(r.consentAccepted),
            submitterUid: r.submitterUid ? String(r.submitterUid) : undefined,
            internalNotes: r.internalNotes ? String(r.internalNotes) : undefined,
          };
        });
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setFsEnquiries(rows);
      },
      (err) => updateStatus('enquiries', err.code)
    ) : undefined;

    const unsubQuotations = canSell ? onSnapshot(
      collection(db, 'quotations'),
      { includeMetadataChanges: true },
      (snap) => {
        updateStatus('quotations', snap.metadata.fromCache ? 'loading' : 'ready');
        const rows: QuotationRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            quotationNumber: String(r.quotationNumber || d.id),
            enquiryId: r.enquiryId ? String(r.enquiryId) : undefined,
            clientUid: r.clientUid ? String(r.clientUid) : undefined,
            clientName: String(r.clientName || ''),
            clientOrganisation: String(r.clientOrganisation || ''),
            clientEmail: String(r.clientEmail || ''),
            clientTelephone: r.clientTelephone ? String(r.clientTelephone) : undefined,
            clientCountry: r.clientCountry ? String(r.clientCountry) : undefined,
            title: String(r.title || ''),
            currency: (r.currency as CurrencyCode) || 'UGX',
            subtotal: Number(r.subtotal ?? 0),
            discountPercent: Number(r.discountPercent ?? 0),
            discountAmount: Number(r.discountAmount ?? 0),
            taxPercent: Number(r.taxPercent ?? 0),
            taxAmount: Number(r.taxAmount ?? 0),
            totalAmount: Number(r.totalAmount ?? 0),
            status: r.status as QuotationStatus,
            validUntil: String(r.validUntil || ''),
            paymentTerms: String(r.paymentTerms || ''),
            notes: r.notes ? String(r.notes) : undefined,
            preparedByName: String(r.preparedByName || ''),
            preparedByEmail: String(r.preparedByEmail || ''),
            createdByUid: String(r.createdByUid || ''),
            createdAt: toIsoString(r.createdAt),
            updatedAt: toIsoString(r.updatedAt),
          };
        });
        rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setFsQuotations(rows);
      },
      (err) => updateStatus('quotations', err.code)
    ) : undefined;

    const unsubDemos = canSell ? onSnapshot(
      collection(db, 'demoBookings'),
      { includeMetadataChanges: true },
      (snap) => {
        updateStatus('demoBookings', snap.metadata.fromCache ? 'loading' : 'ready');
        const rows: DemoBookingRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            referenceNumber: String(r.referenceNumber || d.id),
            createdAt: toIsoString(r.createdAt),
            updatedAt: toIsoString(r.updatedAt),
            status: r.status as DemoBookingRecord['status'],
            productSlug: String(r.productSlug || ''),
            productName: String(r.productName || ''),
            fullName: String(r.fullName || ''),
            organisation: String(r.organisation || ''),
            email: String(r.email || ''),
            telephone: String(r.telephone || ''),
            preferredDate: String(r.preferredDate || ''),
            preferredTime: String(r.preferredTime || ''),
            timezone: String(r.timezone || 'Africa/Kampala'),
            organisationSize: String(r.organisationSize || ''),
            requirements: String(r.requirements || ''),
          };
        });
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setFsDemos(rows);
      },
      (err) => updateStatus('demoBookings', err.code)
    ) : undefined;

    const unsubContacts = (canSell || canSupport) ? onSnapshot(
      collection(db, 'contactMessages'),
      { includeMetadataChanges: true },
      (snap) => {
        updateStatus('contactMessages', snap.metadata.fromCache ? 'loading' : 'ready');
        const rows: ContactMessageRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            referenceNumber: String(r.referenceNumber || d.id),
            createdAt: toIsoString(r.createdAt),
            fullName: String(r.fullName || ''),
            organisation: String(r.organisation || ''),
            email: String(r.email || ''),
            subject: String(r.subject || ''),
            message: String(r.message || ''),
          };
        });
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setFsContacts(rows);
      },
      (err) => updateStatus('contactMessages', err.code)
    ) : undefined;

    const unsubTickets = canSupport ? onSnapshot(
      collection(db, 'supportTickets'),
      { includeMetadataChanges: true },
      (snap) => {
        updateStatus('supportTickets', snap.metadata.fromCache ? 'loading' : 'ready');
        const rows: SupportTicketRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            ownerUid: String(r.ownerUid || ''),
            organisationName: String(r.organisationName || ''),
            subject: String(r.subject || ''),
            category: String(r.category || ''),
            priority: r.priority as SupportTicketRecord['priority'],
            status: r.status as SupportTicketRecord['status'],
            description: String(r.description || ''),
            createdAt: toIsoString(r.createdAt),
            updatedAt: toIsoString(r.updatedAt),
          };
        });
        rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setFsTickets(rows);
      },
      (err) => updateStatus('supportTickets', err.code)
    ) : undefined;

    const unsubProjects = canManageProjects ? onSnapshot(
      collection(db, 'projects'),
      { includeMetadataChanges: true },
      (snap) => {
        updateStatus('projects', snap.metadata.fromCache ? 'loading' : 'ready');
        const rows: ClientProjectRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            ownerUid: String(r.ownerUid || ''),
            organisationName: String(r.organisationName || ''),
            title: String(r.title || ''),
            stage: r.stage as ClientProjectRecord['stage'],
            progressPercent: Number(r.progressPercent ?? 0),
            summary: r.summary ? String(r.summary) : undefined,
            createdAt: toIsoString(r.createdAt),
            updatedAt: toIsoString(r.updatedAt),
          };
        });
        rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setFsProjects(rows);
      },
      (err) => updateStatus('projects', err.code)
    ) : undefined;

    let unsubUsers: (() => void) | undefined;
    let unsubAudit: (() => void) | undefined;

    if (isAdmin) {
      unsubUsers = onSnapshot(
        collection(db, 'users'),
        { includeMetadataChanges: true },
        (snap) => {
          updateStatus('users', snap.metadata.fromCache ? 'loading' : 'ready');
          const rows: UserAccountRecord[] = snap.docs.map((d) => {
            const r = d.data();
            return {
              uid: String(r.uid || d.id),
              displayName: String(r.displayName || ''),
              organisationName: r.organisationName ? String(r.organisationName) : undefined,
              role: r.role as UserAccountRecord['role'],
              active: Boolean(r.active),
              createdAt: toIsoString(r.createdAt),
              updatedAt: toIsoString(r.updatedAt),
            };
          });
          rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setFsUsers(rows);
        },
        (err) => updateStatus('users', err.code)
      );

      unsubAudit = onSnapshot(
        collection(db, 'auditLogs'),
        { includeMetadataChanges: true },
        (snap) => {
          updateStatus('auditLogs', snap.metadata.fromCache ? 'loading' : 'ready');
          const rows: AuditLogRecord[] = snap.docs.map((d) => {
            const r = d.data();
            return {
              id: d.id,
              timestamp: toIsoString(r.createdAt),
              actor: String(r.actorEmail || r.actorUid || 'Staff'),
              action: String(r.action || ''),
              target: String(r.target || ''),
            };
          });
          rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setFsAuditLogs(rows);
        },
        (err) => updateStatus('auditLogs', err.code)
      );
    }

    return () => {
      unsubEnquiries?.();
      unsubQuotations?.();
      unsubDemos?.();
      unsubContacts?.();
      unsubTickets?.();
      unsubProjects?.();
      unsubUsers?.();
      unsubAudit?.();
    };
  }, [usingFirestoreAdmin, isAdmin, canSell, canSupport, canManageProjects]);

  const fetchServerOverview = useCallback(
    async (tokenOverride?: string) => {
      setLoadingServer(true);
      setServerError(null);
      try {
        const headers: Record<string, string> = {};
        const token = tokenOverride ?? adminToken;
        if (token) {
          headers['x-admin-token'] = token;
        }
        const res = await fetch('/api/admin/overview', { headers });
        if (res.status === 401 || res.status === 503) {
          setServerUnlocked(false);
          setServerData(null);
          if (tokenOverride) {
            setServerError('The local server rejected the access key.');
          }
          return;
        }
        if (!res.ok) {
          setServerError('Unable to load server administrative overview.');
          return;
        }
        const json = (await res.json()) as AdminOverviewResponse;
        setServerUnlocked(true);
        setServerData(json);
      } catch {
        setServerError('Backend admin endpoint unreachable (normal in static hosting).');
      } finally {
        setLoadingServer(false);
      }
    },
    [adminToken]
  );

  useEffect(() => {
    if (import.meta.env.DEV && !usingFirestoreAdmin) {
      fetchServerOverview();
    }
  }, [usingFirestoreAdmin, fetchServerOverview]);

  const hasConsoleAccess = usingFirestoreAdmin || serverUnlocked;
  const activeEnquiries = usingFirestoreAdmin ? fsEnquiries : serverData?.enquiries || [];
  const activeQuotations = usingFirestoreAdmin ? fsQuotations : serverData?.quotations || [];
  const activeDemos = usingFirestoreAdmin ? fsDemos : serverData?.demos || [];
  const activeContacts = usingFirestoreAdmin ? fsContacts : serverData?.contacts || [];
  const activeAuditLogs = usingFirestoreAdmin ? fsAuditLogs : serverData?.auditLogs || [];

  const liveTotals = computeQuotationTotals(
    quoteItems,
    quoteForm.discountPercent,
    quoteForm.taxPercent
  );

  const resetQuoteBuilder = () => {
    setEditingQuotationNumber(null);
    setQuoteForm({
      enquiryId: '',
      clientUid: '',
      clientName: '',
      clientOrganisation: '',
      clientEmail: '',
      clientTelephone: '',
      clientCountry: 'Uganda',
      title: '',
      currency: publicConfig.defaultCurrency || 'UGX',
      discountPercent: 0,
      taxPercent: 18,
      validUntil: defaultValidUntilDate(),
      paymentTerms: DEFAULT_PAYMENT_TERMS,
      notes: 'Includes deployment documentation, administrator onboarding, and standard UAT verification.',
    });
    setQuoteItems([
      {
        itemType: 'Service',
        description: 'Discovery, System Architecture & Core Implementation',
        details: '',
        unit: 'Project',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const startQuoteFromEnquiry = (enq: EnquiryRecord) => {
    const matchedProduct = PRODUCTS.find(
      (p) => p.name.toLowerCase() === enq.interestedProduct.toLowerCase()
    );
    const starterItems: QuotationLineInput[] = [
      {
        itemType: 'Service',
        description: `${enq.requiredService} — Discovery, Setup & Integration`,
        details: enq.projectDescription.slice(0, 260),
        unit: 'Project',
        quantity: 1,
        unitPrice: 0,
      },
    ];
    if (matchedProduct) {
      const plan = matchedProduct.plans.find((pl) => pl.prices[enq.currency] !== null) || matchedProduct.plans[0];
      const planPrice = plan?.prices[enq.currency] ?? 0;
      starterItems.push({
        itemType: 'Software License',
        description: `${matchedProduct.name} (${plan?.name || 'Standard Plan'})`,
        details: plan?.audience || matchedProduct.tagline,
        unit: 'Month',
        quantity: 12,
        unitPrice: planPrice || 0,
      });
    }

    setEditingQuotationNumber(null);
    setQuoteForm({
      enquiryId: enq.referenceNumber,
      clientUid: enq.submitterUid || '',
      clientName: enq.fullName,
      clientOrganisation: enq.organisation,
      clientEmail: enq.email,
      clientTelephone: enq.telephone,
      clientCountry: enq.country,
      title: matchedProduct
        ? `${matchedProduct.name} & ${enq.requiredService}`
        : `${enq.requiredService} Proposal`,
      currency: enq.currency,
      discountPercent: 0,
      taxPercent: enq.country.toLowerCase().includes('uganda') ? 18 : 0,
      validUntil: defaultValidUntilDate(),
      paymentTerms: DEFAULT_PAYMENT_TERMS,
      notes: `Prepared in response to enquiry ${enq.referenceNumber} (Requested timeline: ${enq.timeline}).`,
    });
    setQuoteItems(starterItems);
    setActiveTab('quotations');
    setActionNotice(`Loaded enquiry ${enq.referenceNumber} into the Customer Quotation Builder.`);
  };

  const handleAddPresetLine = () => {
    if (!quotePresetKey) return;
    if (quotePresetKey.startsWith('service:')) {
      const slug = quotePresetKey.replace('service:', '');
      const svc = SERVICES.find((s) => s.slug === slug);
      if (svc) {
        setQuoteItems((prev) => [
          ...prev,
          {
            itemType: 'Service',
            description: svc.title,
            details: svc.summary.slice(0, 220),
            unit: 'Project',
            quantity: 1,
            unitPrice: 0,
          },
        ]);
      }
    } else if (quotePresetKey.startsWith('product:')) {
      const [, slug, planIndexStr] = quotePresetKey.split(':');
      const prod = PRODUCTS.find((p) => p.slug === slug);
      const plan = prod?.plans[Number(planIndexStr)];
      if (prod && plan) {
        const price = plan.prices[quoteForm.currency] ?? 0;
        setQuoteItems((prev) => [
          ...prev,
          {
            itemType: 'Software License',
            description: `${prod.name} — ${plan.name}`,
            details: plan.limits.join(' · '),
            unit: 'Month',
            quantity: 1,
            unitPrice: price,
          },
        ]);
      }
    }
    setQuotePresetKey('');
  };

  const handleSaveQuotation = async (targetStatus: QuotationStatus) => {
    setActionNotice(null);
    if (
      quoteForm.clientName.trim().length < 2 ||
      quoteForm.clientOrganisation.trim().length < 2 ||
      !quoteForm.clientEmail.includes('@') ||
      quoteForm.title.trim().length < 3
    ) {
      setActionNotice('Client name, organisation, valid email, and quotation title are required.');
      return;
    }
    if (quoteItems.length === 0 || quoteItems.some((it) => it.description.trim().length < 2)) {
      setActionNotice('Add at least one valid line item with a description.');
      return;
    }

    setQuoteSaving(true);
    try {
      if (usingFirestoreAdmin) {
        const quotation = {
          quotationNumber: editingQuotationNumber || undefined,
          enquiryId: quoteForm.enquiryId || undefined,
          clientUid: quoteForm.clientUid || undefined,
          clientName: quoteForm.clientName,
          clientOrganisation: quoteForm.clientOrganisation,
          clientEmail: quoteForm.clientEmail,
          clientTelephone: quoteForm.clientTelephone || undefined,
          clientCountry: quoteForm.clientCountry || undefined,
          title: quoteForm.title,
          currency: quoteForm.currency,
          discountPercent: quoteForm.discountPercent,
          taxPercent: quoteForm.taxPercent,
          status: targetStatus,
          validUntil: quoteForm.validUntil,
          paymentTerms: quoteForm.paymentTerms,
          notes: quoteForm.notes || undefined,
          items: quoteItems,
        };
        const validation = await fetch('/api/quotations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...quotation,
            subtotal: liveTotals.subtotal,
            discountAmount: liveTotals.discountAmount,
            taxAmount: liveTotals.taxAmount,
            totalAmount: liveTotals.totalAmount,
          }),
        });
        const verdict = await validation.json();
        if (!validation.ok || verdict.valid !== true) {
          setActionNotice(verdict.error || 'Quotation validation failed. Review its fields and try again.');
          return;
        }
        const result = await saveQuotationInFirestore(quotation);
        setEditingQuotationNumber(result.quotationNumber);
        setActionNotice(
          `Quotation ${result.quotationNumber} saved as "${targetStatus}" (${formatCurrencyValue(
            liveTotals.totalAmount,
            quoteForm.currency
          )}).`
        );
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) headers['x-admin-token'] = adminToken;
      const res = await fetch('/api/admin/quotations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quotationNumber: editingQuotationNumber || undefined,
          enquiryId: quoteForm.enquiryId,
          clientName: quoteForm.clientName,
          clientOrganisation: quoteForm.clientOrganisation,
          clientEmail: quoteForm.clientEmail,
          clientTelephone: quoteForm.clientTelephone,
          clientCountry: quoteForm.clientCountry,
          title: quoteForm.title,
          currency: quoteForm.currency,
          discountPercent: quoteForm.discountPercent,
          taxPercent: quoteForm.taxPercent,
          status: targetStatus,
          validUntil: quoteForm.validUntil,
          paymentTerms: quoteForm.paymentTerms,
          notes: quoteForm.notes,
          items: quoteItems,
        }),
      });
      const saved = await res.json();
      if (!res.ok) {
        setActionNotice(saved.error || 'Could not save quotation on server.');
        return;
      }
      setEditingQuotationNumber(saved.quotationNumber);
      setActionNotice(`Quotation ${saved.quotationNumber} saved as "${targetStatus}".`);
      fetchServerOverview();
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Unable to save quotation.');
    } finally {
      setQuoteSaving(false);
    }
  };

  const handleEditQuotation = async (q: QuotationRecord) => {
    setLoadingPreview(true);
    try {
      const items = usingFirestoreAdmin
        ? await fetchQuotationItemsFromFirestore(q.id)
        : q.items || [];
      setEditingQuotationNumber(q.quotationNumber);
      setQuoteForm({
        enquiryId: q.enquiryId || '',
        clientUid: q.clientUid || '',
        clientName: q.clientName,
        clientOrganisation: q.clientOrganisation,
        clientEmail: q.clientEmail,
        clientTelephone: q.clientTelephone || '',
        clientCountry: q.clientCountry || 'Uganda',
        title: q.title,
        currency: q.currency,
        discountPercent: q.discountPercent,
        taxPercent: q.taxPercent,
        validUntil: q.validUntil,
        paymentTerms: q.paymentTerms,
        notes: q.notes || '',
      });
      setQuoteItems(
        items.length > 0
          ? items.map((it) => ({
              itemType: it.itemType,
              description: it.description,
              details: it.details || '',
              unit: it.unit,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            }))
          : [
              {
                itemType: 'Service',
                description: q.title,
                details: '',
                unit: 'Project',
                quantity: 1,
                unitPrice: q.subtotal,
              },
            ]
      );
      setActionNotice(`Editing quotation ${q.quotationNumber}.`);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Unable to load quotation line items.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewQuotation = async (q: QuotationRecord) => {
    setLoadingPreview(true);
    try {
      const items = usingFirestoreAdmin
        ? await fetchQuotationItemsFromFirestore(q.id)
        : q.items || [];
      setPreviewDoc({ quotation: q, items });
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Unable to load quotation document.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewUnsavedDraft = () => {
    const nowIso = new Date().toISOString();
    const draftNumber = editingQuotationNumber || 'QTE-DRAFT-PREVIEW';
    const previewItems: QuotationItemRecord[] = liveTotals.items.map((it, idx) => ({
      id: `preview-${idx}`,
      quotationId: draftNumber,
      sortOrder: it.sortOrder,
      itemType: it.itemType,
      description: it.description || 'Untitled line item',
      details: it.details,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      createdAt: nowIso,
    }));
    setPreviewDoc({
      quotation: {
        id: draftNumber,
        quotationNumber: draftNumber,
        enquiryId: quoteForm.enquiryId || undefined,
        clientUid: quoteForm.clientUid || undefined,
        clientName: quoteForm.clientName || 'Prospective Client',
        clientOrganisation: quoteForm.clientOrganisation || 'Client Organisation',
        clientEmail: quoteForm.clientEmail || 'client@organisation.com',
        clientTelephone: quoteForm.clientTelephone || undefined,
        clientCountry: quoteForm.clientCountry || undefined,
        title: quoteForm.title || 'Project Proposal & Quotation',
        currency: quoteForm.currency,
        subtotal: liveTotals.subtotal,
        discountPercent: liveTotals.discountPercent,
        discountAmount: liveTotals.discountAmount,
        taxPercent: liveTotals.taxPercent,
        taxAmount: liveTotals.taxAmount,
        totalAmount: liveTotals.totalAmount,
        status: 'Draft',
        validUntil: quoteForm.validUntil,
        paymentTerms: quoteForm.paymentTerms,
        notes: quoteForm.notes || undefined,
        preparedByName: user?.displayName || 'DayTech Sales Desk',
        preparedByEmail: user?.email || publicConfig.officialEmail || 'sales@daytechsolutions.ug',
        createdByUid: user?.uid || 'admin',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      items: previewItems,
    });
  };

  const handleQuotationStatusChange = async (id: string, status: QuotationStatus) => {
    setActionNotice(null);
    if (usingFirestoreAdmin) {
      try {
        await updateQuotationStatusInFirestore(id, status, true);
        setActionNotice(`Quotation ${id} updated to "${status}".`);
      } catch (err) {
        setActionNotice(err instanceof Error ? err.message : 'Unable to update quotation status.');
      }
      return;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['x-admin-token'] = adminToken;
    const res = await fetch(`/api/admin/quotations/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchServerOverview();
    }
  };

  const updateEnquiryStatus = async (id: string, status: EnquiryRecord['status']) => {
    setActionNotice(null);
    if (usingFirestoreAdmin) {
      try {
        await updateEnquiryInFirestore(id, status);
        setActionNotice(`Enquiry ${id} updated to "${status}".`);
      } catch (err) {
        setActionNotice(err instanceof Error ? err.message : 'Unable to update enquiry.');
      }
      return;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['x-admin-token'] = adminToken;
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchServerOverview();
    }
  };

  const updateDemoStatus = async (id: string, status: DemoBookingRecord['status']) => {
    setActionNotice(null);
    if (usingFirestoreAdmin) {
      try {
        await updateDemoInFirestore(id, status);
        setActionNotice(`Demo booking ${id} updated to "${status}".`);
      } catch (err) {
        setActionNotice(err instanceof Error ? err.message : 'Unable to update demo booking.');
      }
      return;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['x-admin-token'] = adminToken;
    const res = await fetch(`/api/admin/demos/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchServerOverview();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingFirestoreAdmin) return;
    if (!newProject.ownerUid.trim() || !newProject.organisationName.trim() || !newProject.title.trim()) {
      setActionNotice('Owner UID, Organisation Name, and Project Title are required.');
      return;
    }
    try {
      await createProjectInFirestore(newProject);
      setActionNotice(`Created delivery project "${newProject.title}".`);
      setNewProject({
        ownerUid: '',
        organisationName: '',
        title: '',
        stage: 'Discovery',
        progressPercent: 10,
        summary: '',
      });
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to create project.');
    }
  };

  const exportEnquiriesCsv = () => {
    if (activeEnquiries.length === 0) return;
    const headers = [
      'Reference',
      'Status',
      'Full Name',
      'Organisation',
      'Email',
      'Telephone',
      'Country',
      'Industry',
      'Service',
      'Product',
      'Currency',
      'Budget',
      'Created At',
    ];
    const rows = activeEnquiries.map((e) =>
      [
        e.referenceNumber,
        e.status,
        e.fullName,
        e.organisation,
        e.email,
        e.telephone,
        e.country,
        e.industry,
        e.requiredService,
        e.interestedProduct,
        e.currency,
        e.budgetRange,
        e.createdAt,
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daytech-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServerOverview(adminToken);
  };

  const filteredEnquiries = activeEnquiries.filter((e) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      e.referenceNumber.toLowerCase().includes(q) ||
      e.organisation.toLowerCase().includes(q) ||
      e.fullName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const pendingQuotationsCount = activeEnquiries.filter(
    (e) => e.status === 'New' || e.status === 'In Review'
  ).length;

  return (
    <div className="min-h-[82vh] bg-[#F8FAFC] dark:bg-[#0B1120]">
      <SEOHead
        title="Administrative Operations Console"
        description="Protected DayTech Solutions administrative dashboard."
        noIndex
      />

      {!hasConsoleAccess ? (
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-7 space-y-6">
            <div>
              <Lock className="w-6 h-6 text-[#2563EB] dark:text-[#06B6D4]" />
              <h1 className="mt-3 font-display text-xl font-bold text-[#0B1120] dark:text-white">
                Administrator Access Required
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign in with an authorised DayTech staff Google account.
              </p>
            </div>

            {firebaseReady && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] space-y-3">
                <p className="text-xs font-semibold text-[#0B1120] dark:text-white">
                  Firebase Staff Sign-In
                </p>
                {authError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{authError}</p>
                )}
                {user ? (
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      Signed in as <span className="font-mono">{user.email}</span> (role:{' '}
                      <span className="font-mono">{userAccount?.role || 'client'}</span>).
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      This account does not currently hold a DayTech staff or administrator role.
                    </p>
                    <button
                      type="button"
                      onClick={signOutUser}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={signingIn}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0B1120] dark:bg-slate-800 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{signingIn ? 'Signing In...' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            )}

            {import.meta.env.DEV && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-[#0B1120] dark:text-white">
                  Local development access key
                </p>
                {serverError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>
                )}
                <form onSubmit={handleUnlock} className="space-y-3">
                  <input
                    type="password"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    placeholder="Enter ADMIN_ACCESS_KEY"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={loadingServer}
                    className="w-full py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
                  >
                    {loadingServer ? 'Verifying...' : 'Unlock Server Console'}
                  </button>
                </form>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2">
                  <p>
                    <span className="font-mono">ADMIN_ACCESS_KEY</span> is verified strictly on the server via{' '}
                    <span className="font-mono">x-admin-token</span> and never exposed in frontend bundles.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="print:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-1.5">
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                Operations Console (/admin)
              </p>
              <p className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                DayTech Admin
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                {usingFirestoreAdmin
                  ? `Firestore RBAC (${userAccount?.role || 'super_admin'})`
                  : `Server Mode (${serverData?.adminAuthMode})`}
              </p>
              {user && (
                <button
                  type="button"
                  onClick={signOutUser}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out ({user.email})</span>
                </button>
              )}
            </div>

            {(
              [
                { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
                { id: 'enquiries', label: 'Leads & Enquiries', icon: ClipboardList },
                { id: 'quotations', label: 'Quotations & PDF', icon: FileText },
                { id: 'demos', label: 'Demo Bookings', icon: CalendarClock },
                { id: 'growth', label: 'Product Interest & Partners', icon: Users },
                { id: 'contacts', label: 'Contact Messages', icon: Mail },
                { id: 'operations', label: 'Projects & Support', icon: FolderKanban },
                { id: 'content', label: 'Products & Content', icon: FileSpreadsheet },
                { id: 'audit', label: 'Users, RBAC & Audit Log', icon: Users },
                { id: 'settings', label: 'System Settings', icon: Settings },
              ] as const
            ).filter(tab => allowedTabs.includes(tab.id)).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    active
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#020617]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Admin Viewport */}
          <main className="lg:col-span-9 space-y-6">
            {actionNotice && (
              <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-xs text-[#0B1120] dark:text-blue-200">
                {actionNotice}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Enquiries', collection: 'enquiries', value: activeEnquiries.length },
                    { label: 'Pending Enquiries', collection: 'enquiries', value: pendingQuotationsCount },
                    { label: 'Issued Quotations', collection: 'quotations', value: activeQuotations.length },
                    { label: 'Demo Requests', collection: 'demoBookings', value: activeDemos.length },
                  ].filter(() => canSell || serverUnlocked).map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-5"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
                      <p className="mt-2 font-mono text-2xl font-bold text-[#0B1120] dark:text-white tabular-nums">
                        {serverUnlocked || collectionStatus[kpi.collection] === 'ready'
                          ? kpi.value
                          : collectionStatus[kpi.collection] === 'permission-denied'
                            ? 'Access denied'
                            : collectionStatus[kpi.collection] && collectionStatus[kpi.collection] !== 'loading'
                              ? 'Unavailable'
                              : 'Loading…'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Recent Activity ({usingFirestoreAdmin ? 'Live Cloud Firestore' : 'Local Store'})
                  </h2>
                  {usingFirestoreAdmin && collectionStatus.auditLogs !== 'ready' ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {!isAdmin || collectionStatus.auditLogs === 'permission-denied'
                        ? 'Access denied'
                        : collectionStatus.auditLogs && collectionStatus.auditLogs !== 'loading'
                          ? 'Audit history unavailable'
                          : 'Loading audit history…'}
                    </p>
                  ) : activeAuditLogs.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      No administrative audit events recorded yet. Status updates and project actions appear here automatically.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {activeAuditLogs.slice(0, 8).map((log) => (
                        <div key={log.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                              {log.action}
                            </span>{' '}
                            <span className="text-[#0B1120] dark:text-slate-200">· {log.target}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'enquiries' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Lead &amp; Quotation Enquiries ({filteredEnquiries.length})
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ref, org, email..."
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={exportEnquiriesCsv}
                      disabled={filteredEnquiries.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {filteredEnquiries.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No quotation enquiries recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
                          <th className="py-3 px-4">Reference</th>
                          <th className="py-3 px-4">Organisation &amp; Contact</th>
                          <th className="py-3 px-4">Service / Product</th>
                          <th className="py-3 px-4">Budget</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Quotation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredEnquiries.map((enq) => (
                          <tr key={enq.id}>
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4] whitespace-nowrap">
                              {enq.referenceNumber}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-[#0B1120] dark:text-white">{enq.organisation}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {enq.fullName} · {enq.email}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                              <p>{enq.requiredService}</p>
                              <p className="text-slate-400">{enq.interestedProduct}</p>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {enq.budgetRange}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={enq.status}
                                onChange={(e) =>
                                  updateEnquiryStatus(enq.id, e.target.value as EnquiryRecord['status'])
                                }
                                aria-label={`Status for ${enq.referenceNumber}`}
                                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                              >
                                <option value="New">New</option>
                                <option value="In Review">In Review</option>
                                <option value="Quotation Sent">Quotation Sent</option>
                                <option value="Converted">Converted</option>
                                <option value="Archived">Archived</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => startQuoteFromEnquiry(enq)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                              >
                                <FilePlus2 className="w-3.5 h-3.5" />
                                <span>Generate Quote</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotations' && (
              <div className="space-y-6">
                {/* Interactive Customer Quotation Builder */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                        Customer Quotation Generator
                      </p>
                      <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                        {editingQuotationNumber
                          ? `Editing Quotation ${editingQuotationNumber}`
                          : 'Create Formal Customer Quotation'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={resetQuoteBuilder}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white"
                      >
                        New Blank Quote
                      </button>
                      <button
                        type="button"
                        onClick={handlePreviewUnsavedDraft}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Preview &amp; PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Client & Proposal Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Client Full Name *
                      </label>
                      <input
                        type="text"
                        value={quoteForm.clientName}
                        onChange={(e) => setQuoteForm({ ...quoteForm, clientName: e.target.value })}
                        placeholder="e.g. Sarah Namukasa"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Client Organisation *
                      </label>
                      <input
                        type="text"
                        value={quoteForm.clientOrganisation}
                        onChange={(e) => setQuoteForm({ ...quoteForm, clientOrganisation: e.target.value })}
                        placeholder="e.g. Kampala Apex SACCO"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Client Email *
                      </label>
                      <input
                        type="email"
                        value={quoteForm.clientEmail}
                        onChange={(e) => setQuoteForm({ ...quoteForm, clientEmail: e.target.value })}
                        placeholder="billing@organisation.org"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Telephone
                      </label>
                      <input
                        type="text"
                        value={quoteForm.clientTelephone}
                        onChange={(e) => setQuoteForm({ ...quoteForm, clientTelephone: e.target.value })}
                        placeholder="+256 7..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={quoteForm.clientCountry}
                        onChange={(e) => setQuoteForm({ ...quoteForm, clientCountry: e.target.value })}
                        placeholder="Uganda"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Linked Enquiry Ref (Optional)
                      </label>
                      <input
                        type="text"
                        value={quoteForm.enquiryId}
                        onChange={(e) => setQuoteForm({ ...quoteForm, enquiryId: e.target.value })}
                        placeholder="DTQ-2026-..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-[#0B1120] dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Quotation Title / Scope Summary *
                      </label>
                      <input
                        type="text"
                        value={quoteForm.title}
                        onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })}
                        placeholder="e.g. DayTech SACCO Core Deployment & Member Portal"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Client Portal UID (Optional)
                      </label>
                      {fsUsers.length > 0 ? (
                        <select
                          value={quoteForm.clientUid}
                          onChange={(e) => setQuoteForm({ ...quoteForm, clientUid: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-[#0B1120] dark:text-white"
                        >
                          <option value="">Not linked to portal UID</option>
                          {fsUsers.map((u) => (
                            <option key={u.uid} value={u.uid}>
                              {u.displayName} ({u.uid.slice(0, 8)}...)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={quoteForm.clientUid}
                          onChange={(e) => setQuoteForm({ ...quoteForm, clientUid: e.target.value })}
                          placeholder="Firebase UID (if signed in)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-[#0B1120] dark:text-white"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={quoteForm.currency}
                        onChange={(e) =>
                          setQuoteForm({ ...quoteForm, currency: e.target.value as CurrencyCode })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-[#0B1120] dark:text-white"
                      >
                        <option value="UGX">UGX (Uganda Shillings)</option>
                        <option value="USD">USD (US Dollars)</option>
                        <option value="KES">KES (Kenya Shillings)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Valid Until *
                      </label>
                      <input
                        type="date"
                        value={quoteForm.validUntil}
                        onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-[#0B1120] dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={quoteForm.discountPercent}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, discountPercent: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono tabular-nums text-[#0B1120] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                          VAT / Tax %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={quoteForm.taxPercent}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, taxPercent: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono tabular-nums text-[#0B1120] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Catalogue Preset Loader */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-[#0B1120] dark:text-white">
                      Catalogue Presets:
                    </span>
                    <select
                      value={quotePresetKey}
                      onChange={(e) => setQuotePresetKey(e.target.value)}
                      className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-xs text-[#0B1120] dark:text-white"
                    >
                      <option value="">Select a DayTech Service or Software Plan...</option>
                      <optgroup label="Core Services">
                        {SERVICES.map((svc) => (
                          <option key={svc.slug} value={`service:${svc.slug}`}>
                            {svc.number}. {svc.title}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Software Products & Plans">
                        {PRODUCTS.flatMap((prod) =>
                          prod.plans.map((plan, idx) => (
                            <option
                              key={`${prod.slug}-${idx}`}
                              value={`product:${prod.slug}:${idx}`}
                            >
                              {prod.name} · {plan.name} (
                              {formatCurrencyValue(plan.prices[quoteForm.currency], quoteForm.currency)})
                            </option>
                          ))
                        )}
                      </optgroup>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddPresetLine}
                      disabled={!quotePresetKey}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1120] dark:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Preset Item</span>
                    </button>
                  </div>

                  {/* Line Items Editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold text-[#0B1120] dark:text-white">
                        Itemised Scope &amp; Pricing ({quoteItems.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setQuoteItems((prev) => [
                            ...prev,
                            {
                              itemType: 'Service',
                              description: '',
                              details: '',
                              unit: 'Project',
                              quantity: 1,
                              unitPrice: 0,
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Custom Line</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {quoteItems.map((item, idx) => {
                        const lineAmount =
                          Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * 100) /
                          100;
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] space-y-3 text-xs"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                              <div className="sm:col-span-3">
                                <select
                                  value={item.itemType}
                                  onChange={(e) => {
                                    const next = [...quoteItems];
                                    next[idx] = {
                                      ...next[idx],
                                      itemType: e.target.value as QuotationItemType,
                                    };
                                    setQuoteItems(next);
                                  }}
                                  aria-label={`Line ${idx + 1} category`}
                                  className="w-full px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-[#0B1120] dark:text-white"
                                >
                                  <option value="Service">Service</option>
                                  <option value="Software License">Software License</option>
                                  <option value="Implementation">Implementation</option>
                                  <option value="Infrastructure">Infrastructure</option>
                                  <option value="Support">Support</option>
                                </select>
                              </div>
                              <div className="sm:col-span-4">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => {
                                    const next = [...quoteItems];
                                    next[idx] = { ...next[idx], description: e.target.value };
                                    setQuoteItems(next);
                                  }}
                                  placeholder="Line item title *"
                                  className="w-full px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-[#0B1120] dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <input
                                  type="number"
                                  min={0.01}
                                  step={1}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const next = [...quoteItems];
                                    next[idx] = { ...next[idx], quantity: Number(e.target.value) };
                                    setQuoteItems(next);
                                  }}
                                  aria-label={`Line ${idx + 1} quantity`}
                                  className="w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] font-mono tabular-nums text-right text-[#0B1120] dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => {
                                    const next = [...quoteItems];
                                    next[idx] = { ...next[idx], unit: e.target.value };
                                    setQuoteItems(next);
                                  }}
                                  placeholder="Unit"
                                  aria-label={`Line ${idx + 1} unit`}
                                  className="w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-[#0B1120] dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const next = [...quoteItems];
                                    next[idx] = { ...next[idx], unitPrice: Number(e.target.value) };
                                    setQuoteItems(next);
                                  }}
                                  aria-label={`Line ${idx + 1} unit price`}
                                  className="w-full px-2.5 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] font-mono tabular-nums text-right text-[#0B1120] dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-1 flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={quoteItems.length <= 1}
                                  onClick={() =>
                                    setQuoteItems((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  aria-label={`Remove line ${idx + 1}`}
                                  className="p-2 rounded text-slate-500 hover:text-red-600 disabled:opacity-30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <input
                                type="text"
                                value={item.details || ''}
                                onChange={(e) => {
                                  const next = [...quoteItems];
                                  next[idx] = { ...next[idx], details: e.target.value };
                                  setQuoteItems(next);
                                }}
                                placeholder="Deliverable breakdown or technical notes (optional)"
                                className="flex-1 min-w-[220px] px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] text-[#0B1120] dark:text-slate-200"
                              />
                              <span className="font-mono font-semibold text-[#0B1120] dark:text-white tabular-nums">
                                Line Total: {formatCurrencyValue(lineAmount, quoteForm.currency)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Terms, Notes & Financial Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-3 text-xs">
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Payment Terms *
                        </label>
                        <textarea
                          rows={2}
                          value={quoteForm.paymentTerms}
                          onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Notes &amp; Technical Assumptions
                        </label>
                        <textarea
                          rows={2}
                          value={quoteForm.notes}
                          onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0B1120] dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span className="font-mono tabular-nums text-[#0B1120] dark:text-white">
                          {formatCurrencyValue(liveTotals.subtotal, quoteForm.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Discount ({liveTotals.discountPercent}%)</span>
                        <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          -{formatCurrencyValue(liveTotals.discountAmount, quoteForm.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>VAT / Tax ({liveTotals.taxPercent}%)</span>
                        <span className="font-mono tabular-nums text-[#0B1120] dark:text-white">
                          {formatCurrencyValue(liveTotals.taxAmount, quoteForm.currency)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex justify-between text-sm font-bold">
                        <span className="text-[#0B1120] dark:text-white">Total Quotation</span>
                        <span className="font-mono tabular-nums text-[#2563EB] dark:text-[#06B6D4]">
                          {formatCurrencyValue(liveTotals.totalAmount, quoteForm.currency)}
                        </span>
                      </div>
                      <div className="pt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={quoteSaving}
                          onClick={() => handleSaveQuotation('Draft')}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white disabled:opacity-40"
                        >
                          {quoteSaving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                          type="button"
                          disabled={quoteSaving}
                          onClick={() => handleSaveQuotation('Sent')}
                          className="flex-1 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40"
                        >
                          {quoteSaving ? 'Issuing...' : 'Save & Issue Quote'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issued & Draft Quotations Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                      Generated Quotations ({activeQuotations.length})
                    </h3>
                  </div>

                  {activeQuotations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No formal quotations generated yet. Use the builder above or click &ldquo;Generate Quote&rdquo; on an enquiry.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
                            <th className="py-3 px-4">Quote #</th>
                            <th className="py-3 px-4">Client &amp; Proposal</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4">Valid Until</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {activeQuotations.map((q) => (
                            <tr key={q.id}>
                              <td className="py-3 px-4 font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4] whitespace-nowrap">
                                {q.quotationNumber}
                                {q.enquiryId && (
                                  <span className="block text-[10px] text-slate-500">
                                    Ref: {q.enquiryId}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-[#0B1120] dark:text-white">
                                  {q.clientOrganisation}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {q.title} · {q.clientEmail}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-[#0B1120] dark:text-white tabular-nums whitespace-nowrap">
                                {formatCurrencyValue(q.totalAmount, q.currency)}
                              </td>
                              <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {q.validUntil}
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={q.status}
                                  onChange={(e) =>
                                    handleQuotationStatusChange(
                                      q.id,
                                      e.target.value as QuotationStatus
                                    )
                                  }
                                  aria-label={`Status for ${q.quotationNumber}`}
                                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Sent">Sent</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Declined">Declined</option>
                                  <option value="Expired">Expired</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={loadingPreview}
                                    onClick={() => handleEditQuotation(q)}
                                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={loadingPreview}
                                    onClick={() => handlePreviewQuotation(q)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B1120] dark:bg-slate-800 text-white text-xs font-semibold"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'demos' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Product Demonstration Requests ({activeDemos.length})
                  </h2>
                </div>

                {activeDemos.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No product demonstration requests recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
                          <th className="py-3 px-4">Ref</th>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Client</th>
                          <th className="py-3 px-4">Requested Slot</th>
                          <th className="py-3 px-4">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {activeDemos.map((demo) => (
                          <tr key={demo.id}>
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                              {demo.referenceNumber}
                            </td>
                            <td className="py-3 px-4 font-medium text-[#0B1120] dark:text-white">
                              {demo.productName}
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <p className="font-medium text-[#0B1120] dark:text-slate-200">
                                {demo.organisation}
                              </p>
                              <p className="text-slate-500">
                                {demo.fullName} · {demo.organisationSize}
                              </p>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                              {demo.preferredDate} {demo.preferredTime} ({demo.timezone})
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={demo.status}
                                onChange={(e) =>
                                  updateDemoStatus(demo.id, e.target.value as DemoBookingRecord['status'])
                                }
                                aria-label={`Decision for ${demo.referenceNumber}`}
                                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Rescheduled">Rescheduled</option>
                                <option value="Declined">Declined</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'growth' && <GrowthLeadPanel demos={collectionStatus.demoBookings === 'ready' ? fsDemos : undefined} />}

            {activeTab === 'contacts' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Contact Desk Messages ({activeContacts.length})
                  </h2>
                </div>
                {activeContacts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No general contact messages recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeContacts.map((msg) => (
                      <div key={msg.id} className="p-5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                            {msg.referenceNumber}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#0B1120] dark:text-white">{msg.subject}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          From: {msg.fullName} {msg.organisation ? `(${msg.organisation})` : ''} · {msg.email}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 pt-1">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'operations' && (
              <div className="space-y-6">
                {usingFirestoreAdmin ? (
                  <>
                    {canManageProjects && <>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-4">
                      <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                        Create Client Delivery Project
                      </h2>
                      <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <input
                          type="text"
                          value={newProject.ownerUid}
                          onChange={(e) => setNewProject({ ...newProject, ownerUid: e.target.value })}
                          placeholder="Client Firebase UID (from Users tab)"
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-xs text-[#0B1120] dark:text-white"
                        />
                        <input
                          type="text"
                          value={newProject.organisationName}
                          onChange={(e) =>
                            setNewProject({ ...newProject, organisationName: e.target.value })
                          }
                          placeholder="Organisation Name"
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                        />
                        <input
                          type="text"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          placeholder="Project Title"
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                        />
                        <div className="flex gap-2">
                          <select
                            value={newProject.stage}
                            onChange={(e) =>
                              setNewProject({
                                ...newProject,
                                stage: e.target.value as ClientProjectRecord['stage'],
                              })
                            }
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                          >
                            {['Discovery', 'Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Support'].map(
                              (st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              )
                            )}
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={newProject.progressPercent}
                            onChange={(e) =>
                              setNewProject({ ...newProject, progressPercent: Number(e.target.value) })
                            }
                            className="w-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] font-mono text-xs text-[#0B1120] dark:text-white"
                          />
                        </div>
                        <input
                          type="text"
                          value={newProject.summary}
                          onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
                          placeholder="Milestone summary (optional)"
                          className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-xs text-[#0B1120] dark:text-white"
                        />
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                          >
                            Assign Client Project
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-4">
                      <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                        Active Delivery Projects ({fsProjects.length})
                      </h3>
                      {fsProjects.length === 0 ? (
                        <p className="text-sm text-slate-500">No projects created yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {fsProjects.map((proj) => (
                            <div
                              key={proj.id}
                              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-xs text-slate-500">{proj.organisationName}</p>
                                <p className="text-sm font-semibold text-[#0B1120] dark:text-white">
                                  {proj.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={proj.stage}
                                  onChange={(e) =>
                                    updateProjectInFirestore(proj.id, {
                                      stage: e.target.value as ClientProjectRecord['stage'],
                                    })
                                  }
                                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-xs"
                                >
                                  {['Discovery', 'Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Support'].map(
                                    (st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    )
                                  )}
                                </select>
                                <span className="font-mono text-xs">{proj.progressPercent}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    </>}
                    {canSupport && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-4">
                      <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                        Support Tickets ({fsTickets.length})
                      </h3>
                      {fsTickets.length === 0 ? (
                        <p className="text-sm text-slate-500">No support tickets submitted yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {fsTickets.map((t) => (
                            <div
                              key={t.id}
                              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-xs text-slate-500">
                                  {t.organisationName} · {t.category} · Priority: {t.priority}
                                </p>
                                <p className="text-sm font-semibold text-[#0B1120] dark:text-white">
                                  {t.subject}
                                </p>
                              </div>
                              <select
                                value={t.status}
                                onChange={(e) =>
                                  updateSupportTicketInFirestore(t.id, {
                                    status: e.target.value as SupportTicketRecord['status'],
                                  })
                                }
                                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-xs"
                              >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Awaiting Client">Awaiting Client</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                      Client Projects &amp; Support Desk
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Sign in with an authorised Firebase Staff Google account to manage client delivery projects and live support tickets.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && <ProductPublishingPanel />}

            {activeTab === 'content' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-5">
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  Managed Content Catalogue
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Services Published</p>
                    <p className="font-mono text-xl font-bold text-[#0B1120] dark:text-white mt-1">
                      {SERVICES.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Software Products</p>
                    <p className="font-mono text-xl font-bold text-[#0B1120] dark:text-white mt-1">
                      {PRODUCTS.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Industry Blueprints</p>
                    <p className="font-mono text-xl font-bold text-[#0B1120] dark:text-white mt-1">
                      {INDUSTRIES.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Role-Based Access Control &amp; Audit Trail
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Configured Roles: Super Administrator · Administrator · Content Manager · Sales Officer · Project Manager · Support Officer · Client
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Public registration assigns role <span className="font-mono">client</span> strictly enforced by Firestore security rules. Only Administrators can elevate accounts.
                  </span>
                </div>

                {usingFirestoreAdmin && isAdmin && (
                  <div className="space-y-3">
                    <h3 className="font-display text-base font-semibold text-[#0B1120] dark:text-white">
                      Registered Firebase Accounts ({fsUsers.length})
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                            <th className="py-2.5 px-3">User / UID</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {fsUsers.map((u) => (
                            <tr key={u.uid}>
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-[#0B1120] dark:text-white">
                                  {u.displayName}
                                </p>
                                <p className="font-mono text-[11px] text-slate-500">{u.uid}</p>
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={u.role}
                                  disabled={u.uid === user?.uid}
                                  onChange={(e) =>
                                    updateUserAccountInFirestore(u.uid, {
                                      role: e.target.value as UserAccountRecord['role'],
                                    })
                                  }
                                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120]"
                                >
                                  {[
                                    'client',
                                    'support_officer',
                                    'project_manager',
                                    'sales_officer',
                                    'content_manager',
                                    'admin',
                                    'super_admin',
                                  ].map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {u.active ? 'Active' : 'Suspended'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {activeAuditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                      <span className="font-mono text-[#0B1120] dark:text-slate-200">
                        [{log.actor}] {log.action} → {log.target}
                      </span>
                      <span className="font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-6 text-sm">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    System Configuration, Storage &amp; Feature Flags
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Optional payment, calendar, and WhatsApp integrations remain disabled until credentials are explicitly configured.
                  </p>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">Default Currency &amp; Timezone</dt>
                    <dd className="font-mono font-semibold text-[#0B1120] dark:text-white mt-1">
                      {publicConfig.defaultCurrency} · {publicConfig.defaultTimezone}
                    </dd>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">Primary Database Persistence</dt>
                    <dd className="font-mono text-xs text-[#0B1120] dark:text-white mt-1">
                      {publicConfig.storage?.persistent
                        ? `Active (${publicConfig.storage.provider})`
                        : 'Unavailable'}
                    </dd>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">Firebase Project &amp; Auth</dt>
                    <dd className="font-mono text-xs text-[#0B1120] dark:text-white mt-1">
                      {publicConfig.features.firebaseEnabled
                        ? 'Connected (Project: daytech-bba8f)'
                        : 'Disabled'}
                    </dd>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">Payment Gateways (VITE_FEATURE_PAYMENTS)</dt>
                    <dd className="font-mono text-xs text-[#0B1120] dark:text-white mt-1">
                      {publicConfig.features.paymentsEnabled ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">Google Calendar (VITE_FEATURE_GOOGLE_CALENDAR)</dt>
                    <dd className="font-mono text-xs text-[#0B1120] dark:text-white mt-1">
                      {publicConfig.features.googleCalendarEnabled ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <dt className="text-xs text-slate-500">WhatsApp Floating Widget (VITE_FEATURE_WHATSAPP)</dt>
                    <dd className="font-mono text-xs text-[#0B1120] dark:text-white mt-1">
                      {publicConfig.features.whatsappEnabled ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Printable / PDF Quotation Modal (hidden on print; dedicated A4 print container below renders cleanly) */}
      {previewDoc && (
        <>
          <div className="print:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3">
                <p className="font-mono text-xs font-semibold text-[#0B1120] dark:text-white">
                  Quotation Preview · {previewDoc.quotation.quotationNumber}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save as PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    aria-label="Close quotation preview"
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <QuotationDocument
                quotation={previewDoc.quotation}
                items={previewDoc.items}
                publicConfig={publicConfig}
              />
            </div>
          </div>

          <div className="hidden print:block">
            <QuotationDocument
              quotation={previewDoc.quotation}
              items={previewDoc.items}
              publicConfig={publicConfig}
            />
          </div>
        </>
      )}
    </div>
  );
}
