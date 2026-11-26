import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileCheck,
  FileText,
  FolderKanban,
  LifeBuoy,
  Lock,
  LogIn,
  LogOut,
  Printer,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { z } from 'zod';
import { SEOHead } from '../components/SEOHead';
import { QuotationDocument } from '../components/QuotationDocument';
import { formatCurrencyValue } from '../data/products';
import { useAppContext } from '../context/AppContext';
import { useFirebase } from '../context/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase/client';
import {
  createSupportTicketInFirestore,
  fetchQuotationItemsFromFirestore,
  toIsoString,
  updateQuotationStatusInFirestore,
} from '../lib/firebase/firestoreService';
import {
  ClientProjectRecord,
  CurrencyCode,
  DemoBookingRecord,
  EnquiryRecord,
  QuotationItemRecord,
  QuotationRecord,
  QuotationStatus,
  SupportTicketRecord,
} from '../types/domain';

type PortalTab = 'lookup' | 'quotations' | 'projects' | 'tickets' | 'billing' | 'documents';

interface LookupResult {
  type: string;
  referenceNumber: string;
  status: string;
  organisation: string;
  service?: string;
  product?: string;
  currency?: string;
  totalAmount?: number;
  validUntil?: string;
  quotation?: QuotationRecord;
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

const ticketSchema = z.object({
  organisationName: z.string().trim().min(2, 'Organisation name is required').max(150),
  subject: z.string().trim().min(4, 'Subject is required (min 4 characters)').max(160),
  category: z.string().trim().min(2).max(60),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']),
  description: z.string().trim().min(10, 'Describe your issue (min 10 characters)').max(3000),
});

export function ClientPortalPage() {
  const [searchParams] = useSearchParams();
  const { publicConfig } = useAppContext();
  const {
    firebaseReady,
    authReady,
    user,
    userAccount,
    authError,
    signingIn,
    signInWithGoogle,
    signOutUser,
    getIdToken,
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<PortalTab>('lookup');
  const [refInput, setRefInput] = useState(searchParams.get('ref') || '');
  const shareToken = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResponse, setLookupResponse] = useState<{
    result: LookupResult;
    ownerUid?: string;
    shareToken?: string;
  } | null>(null);
  const lookupResult = lookupResponse && (lookupResponse.shareToken
    ? lookupResponse.shareToken === shareToken
    : lookupResponse.ownerUid === user?.uid && userAccount?.active)
    ? lookupResponse.result
    : null;

  const [myEnquiries, setMyEnquiries] = useState<EnquiryRecord[]>([]);
  const [myQuotations, setMyQuotations] = useState<QuotationRecord[]>([]);
  const [myDemos, setMyDemos] = useState<DemoBookingRecord[]>([]);
  const [myProjects, setMyProjects] = useState<ClientProjectRecord[]>([]);
  const [myTickets, setMyTickets] = useState<SupportTicketRecord[]>([]);

  const [previewDoc, setPreviewDoc] = useState<{
    quotation: QuotationRecord;
    items: QuotationItemRecord[];
  } | null>(null);
  const [loadingQuoteDoc, setLoadingQuoteDoc] = useState(false);
  const [quoteActionNotice, setQuoteActionNotice] = useState<string | null>(null);

  const [ticketForm, setTicketForm] = useState({
    organisationName: '',
    subject: '',
    category: 'Technical Support',
    priority: 'Normal' as SupportTicketRecord['priority'],
    description: '',
  });
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady || !authReady || !user || !user.emailVerified || !db) {
      setMyEnquiries([]);
      setMyQuotations([]);
      setMyDemos([]);
      setMyProjects([]);
      setMyTickets([]);
      return;
    }

    const uid = user.uid;

    const unsubEnquiries = onSnapshot(
      query(collection(db, 'enquiries'), where('submitterUid', '==', uid)),
      (snap) => {
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
          };
        });
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setMyEnquiries(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'enquiries')
    );

    const unsubDemos = onSnapshot(
      query(collection(db, 'demoBookings'), where('submitterUid', '==', uid)),
      (snap) => {
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
        setMyDemos(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'demoBookings')
    );

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), where('ownerUid', '==', uid)),
      (snap) => {
        const rows: ClientProjectRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            ownerUid: String(r.ownerUid || uid),
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
        setMyProjects(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

    const unsubTickets = onSnapshot(
      query(collection(db, 'supportTickets'), where('ownerUid', '==', uid)),
      (snap) => {
        const rows: SupportTicketRecord[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            ownerUid: String(r.ownerUid || uid),
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
        setMyTickets(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'supportTickets')
    );

    const unsubQuotations = onSnapshot(
      query(collection(db, 'quotations'), where('clientUid', '==', uid)),
      (snap) => {
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
        setMyQuotations(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'quotations')
    );

    return () => {
      unsubEnquiries();
      unsubQuotations();
      unsubDemos();
      unsubProjects();
      unsubTickets();
    };
  }, [firebaseReady, authReady, user]);

  useEffect(() => {
    if (!shareToken) return;
    const controller = new AbortController();
    setLookupResponse(null);
    setLookupError(null);
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch(
          `/api/portal/lookup?${new URLSearchParams({ token: shareToken })}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setLookupError(data.error || 'This quotation link could not be opened.');
          return;
        }
        setLookupResponse({ result: data, shareToken });
      } catch {
        if (!controller.signal.aborted) setLookupError('Unable to open the quotation link. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [shareToken]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResponse(null);

    if (!refInput.trim() || !user || !userAccount?.active) {
      setLookupError('Sign in with Google and enter your reference number.');
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Sign in with Google to look up a reference.');
      const response = await fetch(
        `/api/portal/lookup?${new URLSearchParams({ ref: refInput.trim() })}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        setLookupError(data.error || 'Unable to look up this reference.');
        return;
      }
      setLookupResponse({ result: data, ownerUid: user.uid });
    } catch {
      setLookupError('Reference lookup is unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError(null);
    setTicketSuccess(null);

    if (!user || !user.emailVerified) {
      setTicketError('Please sign in with your verified Google account to submit a support ticket.');
      return;
    }

    const parsed = ticketSchema.safeParse(ticketForm);
    if (!parsed.success) {
      const firstErr = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      setTicketError(firstErr || 'Please check your ticket details.');
      return;
    }

    setTicketSubmitting(true);
    try {
      const ticketId = await createSupportTicketInFirestore({
        ...parsed.data,
        ownerUid: user.uid,
      });
      setTicketSuccess(`Support ticket ${ticketId} created and assigned to our support queue.`);
      setTicketForm((prev) => ({ ...prev, subject: '', description: '' }));
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : 'Unable to create support ticket.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleOpenQuotation = async (q: QuotationRecord) => {
    setQuoteActionNotice(null);
    setLoadingQuoteDoc(true);
    try {
      const items = q.items && q.items.length > 0
        ? q.items
        : await fetchQuotationItemsFromFirestore(q.id);
      setPreviewDoc({ quotation: q, items });
    } catch (err) {
      setQuoteActionNotice(err instanceof Error ? err.message : 'Unable to open quotation details.');
    } finally {
      setLoadingQuoteDoc(false);
    }
  };

  const handleClientQuotationDecision = async (q: QuotationRecord, decision: 'Accepted' | 'Declined') => {
    setQuoteActionNotice(null);
    try {
      await updateQuotationStatusInFirestore(q.id, decision, false);
      setQuoteActionNotice(`Quotation ${q.quotationNumber} marked as ${decision}.`);
      setPreviewDoc((prev) =>
        prev && prev.quotation.id === q.id
          ? { ...prev, quotation: { ...prev.quotation, status: decision } }
          : prev
      );
    } catch (err) {
      setQuoteActionNotice(err instanceof Error ? err.message : 'Unable to record quotation decision.');
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#F8FAFC] dark:bg-[#0B1120]">
      <SEOHead
        title="Client Portal"
        description="DayTech Solutions Client Portal for tracking quotation requests, formal quotations, projects, subscriptions, invoices, and support tickets."
        noIndex
      />

      <div className="print:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Client Self-Service Workspace · Cloud Firestore Connected
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#0B1120] dark:text-white">
              DayTech Client Portal
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sign in with Google for live account-scoped enquiries, projects, and support tickets, or verify a reference below.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {firebaseReady && (
              user ? (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120]">
                  <span className="text-xs font-medium text-[#0B1120] dark:text-slate-200">
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1120] dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{signingIn ? 'Signing In...' : 'Sign in with Google'}</span>
                </button>
              )
            )}
            <Link
              to="/quote"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              New Quotation Request
            </Link>
            <Link
              to="/demo"
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0B1120] dark:text-white whitespace-nowrap shrink-0"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </div>

      <div className="print:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-2">
          {(
            [
              { id: 'lookup', label: 'Enquiries & Demo Tracker', icon: Search },
              { id: 'quotations', label: 'Quotations & Proposals', icon: FileCheck },
              { id: 'projects', label: 'Project Milestones', icon: FolderKanban },
              { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
              { id: 'billing', label: 'Invoices & Mobile Money', icon: CreditCard },
              { id: 'documents', label: 'Documents & Contracts', icon: FileText },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#020617] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#0B1120] dark:text-white">
              <Lock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#06B6D4]" />
              <span>Access &amp; Security Boundary</span>
            </div>
            <p className="leading-relaxed">
              Clients only access records belonging to their authenticated UID or verified reference. Public accounts default strictly to role{' '}
              <span className="font-mono">client</span>.
            </p>
            {userAccount && (
              <p className="font-mono text-[11px] text-[#2563EB] dark:text-[#06B6D4]">
                Signed in role: {userAccount.role}
              </p>
            )}
          </div>
        </aside>

        {/* Main Workspace Panel */}
        <div className="lg:col-span-9 space-y-6">
          {authError && (
            <div className="p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {activeTab === 'lookup' && (
            <div className="space-y-6">
              {user && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                        Your Account Submissions (Live Firestore)
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Automatically linked when you submit a Quotation Request or Demo Booking while signed in.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#2563EB] dark:text-[#06B6D4]">
                      {myEnquiries.length} Enquiries · {myDemos.length} Demos
                    </span>
                  </div>

                  {myEnquiries.length === 0 && myDemos.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No Firestore submissions linked to your Google account UID yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {myEnquiries.map((enq) => (
                        <div
                          key={enq.id}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                              {enq.referenceNumber} · Quotation Enquiry
                            </p>
                            <p className="text-sm font-semibold text-[#0B1120] dark:text-white mt-0.5">
                              {enq.requiredService} ({enq.interestedProduct})
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {enq.organisation} · {enq.budgetRange}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#0B1120] dark:text-slate-200 font-mono">
                            {enq.status}
                          </span>
                        </div>
                      ))}
                      {myDemos.map((demo) => (
                        <div
                          key={demo.id}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                              {demo.referenceNumber} · Product Demo
                            </p>
                            <p className="text-sm font-semibold text-[#0B1120] dark:text-white mt-0.5">
                              {demo.productName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                              {demo.preferredDate} {demo.preferredTime} ({demo.timezone})
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#0B1120] dark:text-slate-200 font-mono">
                            {demo.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                  Verified Reference Status Lookup
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Enter the reference number (e.g., <span className="font-mono">DTQ-...</span> or{' '}
                  <span className="font-mono">DTD-...</span>) after signing in with Google.
                </p>

                <form onSubmit={handleLookup} className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input
                    type="text"
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    placeholder="Reference (DTQ-2026-...)"
                    aria-label="Reference Number"
                    className="sm:col-span-10 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm font-mono text-[#0B1120] dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={loading || !userAccount?.active}
                    className="sm:col-span-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    {loading ? 'Checking...' : 'Check'}
                  </button>
                </form>

                {lookupError && (
                  <p className="mt-4 text-sm text-red-600 dark:text-red-400">{lookupError}</p>
                )}

                {lookupResult && (
                  <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{lookupResult.type}</p>
                        <p className="font-mono text-lg font-bold text-[#0B1120] dark:text-white">
                          {lookupResult.referenceNumber}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                        Status: {lookupResult.status}
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500 dark:text-slate-400">Organisation</dt>
                        <dd className="font-medium text-[#0B1120] dark:text-slate-100">{lookupResult.organisation}</dd>
                      </div>
                      {lookupResult.service && (
                        <div>
                          <dt className="text-xs text-slate-500 dark:text-slate-400">Required Service</dt>
                          <dd className="font-medium text-[#0B1120] dark:text-slate-100">{lookupResult.service}</dd>
                        </div>
                      )}
                      {lookupResult.product && (
                        <div>
                          <dt className="text-xs text-slate-500 dark:text-slate-400">Software Product</dt>
                          <dd className="font-medium text-[#0B1120] dark:text-slate-100">{lookupResult.product}</dd>
                        </div>
                      )}
                      {lookupResult.preferredDate && (
                        <div>
                          <dt className="text-xs text-slate-500 dark:text-slate-400">Requested Slot</dt>
                          <dd className="font-mono text-xs font-medium text-[#0B1120] dark:text-slate-100">
                            {lookupResult.preferredDate} · {lookupResult.preferredTime} ({lookupResult.timezone})
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs text-slate-500 dark:text-slate-400">Submitted At</dt>
                        <dd className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {new Date(lookupResult.createdAt).toLocaleString()}
                        </dd>
                      </div>
                      {typeof lookupResult.totalAmount === 'number' && lookupResult.currency && (
                        <div>
                          <dt className="text-xs text-slate-500 dark:text-slate-400">Quotation Total</dt>
                          <dd className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#06B6D4]">
                            {formatCurrencyValue(lookupResult.totalAmount, lookupResult.currency as CurrencyCode)}
                          </dd>
                        </div>
                      )}
                    </dl>
                    {lookupResult.quotation && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenQuotation(lookupResult.quotation!)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View &amp; Print Formal Quotation</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotations' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                    Formal Customer Quotations &amp; Proposals
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Review itemised DayTech quotations, download printable PDF copies, or confirm acceptance.
                  </p>
                </div>
                {!user && firebaseReady && (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>

              {quoteActionNotice && (
                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-xs text-[#0B1120] dark:text-blue-200">
                  {quoteActionNotice}
                </div>
              )}

              {!user ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sign in with your verified Google account to view formal quotations issued to your organisation, or look up a <span className="font-mono">QTE-...</span> reference in Enquiries &amp; Demo Tracker.
                </p>
              ) : myQuotations.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No formal quotations are currently linked to your account UID ({user.uid}).
                </p>
              ) : (
                <div className="space-y-4">
                  {myQuotations.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                          {q.quotationNumber} · Valid until {q.validUntil}
                        </p>
                        <h3 className="font-display text-base font-bold text-[#0B1120] dark:text-white">
                          {q.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {q.clientOrganisation} · Total:{' '}
                          <span className="font-mono font-semibold text-[#0B1120] dark:text-white tabular-nums">
                            {formatCurrencyValue(q.totalAmount, q.currency)}
                          </span>{' '}
                          · Status: <span className="font-mono font-semibold">{q.status}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={loadingQuoteDoc}
                          onClick={() => handleOpenQuotation(q)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1120] dark:bg-slate-800 text-white text-xs font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View &amp; PDF</span>
                        </button>
                        {q.status === 'Sent' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleClientQuotationDecision(q, 'Accepted')}
                              className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
                            >
                              Accept Quote
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClientQuotationDecision(q, 'Declined')}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                    Client Project Milestones &amp; Updates
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Delivery milestones tracked across DayTech’s 7-stage engineering workflow.
                  </p>
                </div>
                {!user && firebaseReady && (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>

              {!user ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sign in with your verified Google account to view projects assigned to your organisation.
                </p>
              ) : myProjects.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No active delivery projects are currently assigned to your account ({user.uid}).
                </p>
              ) : (
                <div className="space-y-4">
                  {myProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {proj.organisationName}
                          </p>
                          <h3 className="font-display text-base font-bold text-[#0B1120] dark:text-white">
                            {proj.title}
                          </h3>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                          Stage: {proj.stage} ({proj.progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] dark:bg-[#06B6D4] transition-all"
                          style={{ width: `${proj.progressPercent}%` }}
                        />
                      </div>
                      {proj.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {proj.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                      Technical Support Ticket Desk
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Submit technical support tickets and track engineering status updates in real time.
                    </p>
                  </div>
                  {!user && firebaseReady && (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                    >
                      Sign in with Google
                    </button>
                  )}
                </div>

                {!user ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Sign in with Google to open or inspect support tickets scoped to your account.
                  </p>
                ) : (
                  <form onSubmit={handleCreateTicket} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="font-display text-base font-semibold text-[#0B1120] dark:text-white">
                      Open a New Support Ticket
                    </h3>

                    {ticketError && (
                      <div className="p-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                        {ticketError}
                      </div>
                    )}
                    {ticketSuccess && (
                      <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{ticketSuccess}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Organisation Name *
                        </label>
                        <input
                          type="text"
                          value={ticketForm.organisationName}
                          onChange={(e) =>
                            setTicketForm({ ...ticketForm, organisationName: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                          placeholder="Your organisation"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={ticketForm.subject}
                          onChange={(e) =>
                            setTicketForm({ ...ticketForm, subject: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                          placeholder="Concise summary of the issue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Category
                        </label>
                        <select
                          value={ticketForm.category}
                          onChange={(e) =>
                            setTicketForm({ ...ticketForm, category: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                        >
                          <option value="Technical Support">Technical Support</option>
                          <option value="Network / Infrastructure">Network / Infrastructure</option>
                          <option value="Cloud & Backups">Cloud &amp; Backups</option>
                          <option value="Billing & Licensing">Billing &amp; Licensing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Priority
                        </label>
                        <select
                          value={ticketForm.priority}
                          onChange={(e) =>
                            setTicketForm({
                              ...ticketForm,
                              priority: e.target.value as SupportTicketRecord['priority'],
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description *
                      </label>
                      <textarea
                        rows={3}
                        value={ticketForm.description}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                        placeholder="Describe steps to reproduce, affected branch/system, or urgency..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ticketSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
                    >
                      {ticketSubmitting ? 'Submitting Ticket...' : 'Create Support Ticket'}
                    </button>
                  </form>
                )}
              </div>

              {user && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-4">
                  <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Your Support Tickets ({myTickets.length})
                  </h3>
                  {myTickets.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No support tickets created under your account yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {myTickets.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t.category} · Priority: {t.priority}
                            </p>
                            <p className="text-sm font-semibold text-[#0B1120] dark:text-white mt-0.5">
                              {t.subject}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {t.description}
                            </p>
                          </div>
                          <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'billing' || activeTab === 'documents') && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-8 space-y-5">
              <div className="flex items-start gap-3">
                <UserCheck className="w-6 h-6 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                    {activeTab === 'billing'
                      ? 'Subscriptions, Invoices & Payment Readiness'
                      : 'Authorised Document Downloads'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeTab === 'billing'
                      ? 'This module is architected for UGX and multi-currency invoicing alongside future MTN Mobile Money Uganda, Airtel Money Uganda, bank transfer, and card payment gateways. Live payment collection remains disabled until merchant accounts and webhook verification are configured.'
                      : 'Signed proposals, Master Services Agreements, and technical handover packs are distributed once a formal client project is active.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>
                  Firebase Auth &amp; Firestore:{' '}
                  <span className="font-mono">
                    {publicConfig.features.firebaseEnabled ? 'Connected (daytech-bba8f)' : 'Disabled'}
                  </span>
                </p>
                <p>
                  Payment Gateways (MTN / Airtel / Card):{' '}
                  <span className="font-mono">
                    {publicConfig.features.paymentsEnabled ? 'Active' : 'Disabled pending merchant setup'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <>
          <div className="print:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3">
                <p className="font-mono text-xs font-semibold text-[#0B1120] dark:text-white">
                  {previewDoc.quotation.quotationNumber} · {previewDoc.quotation.status}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {user &&
                    previewDoc.quotation.clientUid === user.uid &&
                    previewDoc.quotation.status === 'Sent' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleClientQuotationDecision(previewDoc.quotation, 'Accepted')
                        }
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Accept Quotation
                      </button>
                    )}
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
