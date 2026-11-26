import React, { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { SEOHead } from '../components/SEOHead';
import { SERVICES } from '../data/services';
import { PRODUCTS } from '../data/products';
import { INDUSTRIES } from '../data/industries';
import { useAppContext } from '../context/AppContext';
import { CurrencyCode } from '../types/domain';
import { createEnquiryInFirestore } from '../lib/firebase/firestoreService';

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(120),
  organisation: z.string().trim().min(2, 'Please enter your organisation name').max(150),
  email: z.string().trim().email('Please enter a valid email address').max(160),
  telephone: z.string().trim().min(7, 'Please enter a valid telephone number').max(40),
  country: z.string().trim().min(2, 'Please specify your country').max(80),
  industry: z.string().trim().min(2, 'Please select an industry').max(100),
  requiredService: z.string().trim().min(2, 'Please select a service').max(120),
  interestedProduct: z.string().trim().min(1).max(120),
  projectDescription: z
    .string()
    .trim()
    .min(15, 'Please provide at least 15 characters describing your needs')
    .max(3000),
  budgetRange: z.string().trim().min(2, 'Please select an estimated budget range').max(100),
  currency: z.enum(['UGX', 'USD', 'KES']),
  timeline: z.string().trim().min(2, 'Please select a preferred timeline').max(100),
  preferredContactMethod: z.enum(['Email', 'Telephone', 'WhatsApp', 'Video Meeting']),
  consentAccepted: z.literal(true, {
    error: 'You must consent to DayTech processing your enquiry details',
  }),
});

const BUDGET_OPTIONS: Record<CurrencyCode, string[]> = {
  UGX: [
    'Under UGX 5,000,000',
    'UGX 5,000,000 – UGX 15,000,000',
    'UGX 15,000,000 – UGX 45,000,000',
    'UGX 45,000,000 – UGX 120,000,000',
    'Above UGX 120,000,000',
  ],
  USD: [
    'Under $1,500',
    '$1,500 – $5,000',
    '$5,000 – $15,000',
    '$15,000 – $40,000',
    'Above $40,000',
  ],
  KES: [
    'Under KES 200,000',
    'KES 200,000 – KES 650,000',
    'KES 650,000 – KES 2,000,000',
    'KES 2,000,000 – KES 5,000,000',
    'Above KES 5,000,000',
  ],
};

export function QuotePage() {
  const [searchParams] = useSearchParams();
  const { currency: defaultCurrency, publicConfig } = useAppContext();
  const safeCurrency: CurrencyCode =
    defaultCurrency === 'USD' || defaultCurrency === 'KES' ? defaultCurrency : 'UGX';
  const storageAvailable = publicConfig.storage?.persistent !== false;

  const locationParam = searchParams.get('location');

  const [form, setForm] = useState({
    fullName: '',
    organisation: '',
    email: '',
    telephone: '',
    country: 'Uganda',
    industry: searchParams.get('industry') || INDUSTRIES[0].name,
    requiredService: searchParams.get('service') || SERVICES[0].title,
    interestedProduct: searchParams.get('product') || 'None / Custom Solution',
    projectDescription: locationParam ? `Deployment / Site Location: ${locationParam}\n\n` : '',
    currency: safeCurrency,
    budgetRange: BUDGET_OPTIONS[safeCurrency][1],
    timeline: '1 – 3 Months',
    preferredContactMethod: 'Email' as 'Email' | 'Telephone' | 'WhatsApp' | 'Video Meeting',
    consentAccepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    referenceNumber: string;
    createdAt: string;
  } | null>(null);

  const handleCurrencyChange = (nextCurrency: CurrencyCode) => {
    setForm((prev) => ({
      ...prev,
      currency: nextCurrency,
      budgetRange: BUDGET_OPTIONS[nextCurrency][1],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionInFlight.current) return;
    setErrors({});
    setSubmitError(null);

    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [k, v] of Object.entries(flat)) {
        if (v && v[0]) fieldErrors[k] = v[0];
      }
      setErrors(fieldErrors);
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      if (publicConfig.features.firebaseEnabled) {
        const result = await createEnquiryInFirestore(parsed.data);
        setConfirmation({
          referenceNumber: result.referenceNumber,
          createdAt: result.createdAt,
        });
        return;
      }

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not save your quotation request. Please verify your inputs.');
        return;
      }
      setConfirmation({
        referenceNumber: data.referenceNumber,
        createdAt: data.createdAt,
      });
    } catch (err) {
      let msg = 'Unable to save your enquiry in database storage. Please try again.';
      if (err instanceof Error) {
        try {
          const info = JSON.parse(err.message) as { error?: string };
          if (info.error) msg = info.error;
        } catch {
          msg = err.message;
        }
      }
      setSubmitError(msg);
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SEOHead
        title="Request a Quotation"
        description="Submit your software, IT infrastructure, cloud, or cybersecurity project requirements for a tailored DayTech Solutions quotation."
      />

      <section className="py-14 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Project Scoping &amp; Quotations
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
            Request a Formal Quotation
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Provide your organisation and project details below. Enquiries are validated, persisted securely, and assigned a unique tracking reference number.
          </p>
        </div>
      </section>

      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {confirmation ? (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#020617] p-8">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white">
                    Enquiry Saved Successfully
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Your quotation request has been recorded in our system. Keep your reference number below to track status in the Client Portal.
                  </p>
                  <div className="mt-5 p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 inline-block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reference Number</p>
                    <p className="font-mono text-xl font-bold text-[#2563EB] dark:text-[#06B6D4] mt-0.5">
                      {confirmation.referenceNumber}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/portal?ref=${confirmation.referenceNumber}`}
                      className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
                    >
                      Track in Client Portal
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmation(null);
                        setForm((prev) => ({ ...prev, projectDescription: '', consentAccepted: false }));
                      }}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-6"
            >
              {!storageAvailable && (
                <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    Persistent database storage is currently unavailable ({publicConfig.storage?.note}). Submissions are disabled so no enquiry is lost or falsely confirmed.
                  </span>
                </div>
              )}

              {submitError && (
                <div className="p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="e.g., Sarah Namukasa"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Organisation *
                  </label>
                  <input
                    type="text"
                    value={form.organisation}
                    onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="Company, SACCO, or Institution"
                  />
                  {errors.organisation && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.organisation}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="name@organisation.org"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Telephone Number *
                  </label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="+256 ..."
                  />
                  {errors.telephone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.telephone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  {errors.country && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Industry *
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.slug} value={ind.name}>
                        {ind.name}
                      </option>
                    ))}
                    <option value="Other">Other Sector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Required Service *
                  </label>
                  <select
                    value={form.requiredService}
                    onChange={(e) => setForm({ ...form, requiredService: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {SERVICES.map((srv) => (
                      <option key={srv.slug} value={srv.title}>
                        {srv.title}
                      </option>
                    ))}
                    <option value="Multiple Services / Transformation">
                      Multiple Services / Transformation
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Interested Software Product
                  </label>
                  <select
                    value={form.interestedProduct}
                    onChange={(e) => setForm({ ...form, interestedProduct: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="None / Custom Solution">None / Custom Solution</option>
                    {PRODUCTS.map((p) => (
                      <option key={p.slug} value={p.name}>
                        {p.name} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Currency &amp; Estimated Budget Range *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.currency}
                      onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                      aria-label="Quotation currency"
                      className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-[#0B1120] dark:text-white"
                    >
                      <option value="UGX">UGX</option>
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                    </select>
                    <select
                      value={form.budgetRange}
                      onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                    >
                      {BUDGET_OPTIONS[form.currency].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Preferred Implementation Timeline *
                  </label>
                  <select
                    value={form.timeline}
                    onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  >
                    <option value="Immediate (Under 1 Month)">Immediate (Under 1 Month)</option>
                    <option value="1 – 3 Months">1 – 3 Months</option>
                    <option value="3 – 6 Months">3 – 6 Months</option>
                    <option value="6+ Months / Phased">6+ Months / Phased</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                  Preferred Contact Method *
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Email', 'Telephone', 'WhatsApp', 'Video Meeting'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm({ ...form, preferredContactMethod: method })}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        form.preferredContactMethod === method
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                  Project Description *
                </label>
                <textarea
                  rows={4}
                  value={form.projectDescription}
                  onChange={(e) => setForm({ ...form, projectDescription: e.target.value })}
                  placeholder="Describe your operational goals, user count, branches, or technical integrations required..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                {errors.projectDescription && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.projectDescription}</p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.consentAccepted}
                    onChange={(e) => setForm({ ...form, consentAccepted: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    I consent to DayTech Solutions processing the submitted information solely to evaluate my enquiry and prepare a project quotation, in accordance with our{' '}
                    <Link to="/legal/privacy" className="text-[#2563EB] dark:text-[#06B6D4] underline">
                      Privacy &amp; Data Protection Policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.consentAccepted && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.consentAccepted}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Default currency: {form.currency} · Persisted with unique reference ID
                </span>
                <button
                  type="submit"
                  disabled={submitting || !storageAvailable}
                  className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  {submitting ? 'Saving Enquiry...' : 'Submit Quotation Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
