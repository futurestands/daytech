import React, { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { SEOHead } from '../components/SEOHead';
import { PRODUCTS } from '../data/products';
import { useAppContext } from '../context/AppContext';
import { createDemoBookingInFirestore } from '../lib/firebase/firestoreService';

const demoSchema = z.object({
  productSlug: z.string().min(1, 'Select a product').max(80),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  organisation: z.string().trim().min(2, 'Organisation name is required').max(150),
  email: z.string().trim().email('Valid email address is required').max(160),
  telephone: z.string().trim().min(7, 'Valid telephone number is required').max(40),
  preferredDate: z.string().min(4, 'Select a preferred date').max(40),
  preferredTime: z.string().min(2, 'Select a preferred time').max(40),
  timezone: z.string().default('Africa/Kampala'),
  organisationSize: z.string().min(1, 'Select organisation size').max(60),
  requirements: z
    .string()
    .trim()
    .min(10, 'Share brief demonstration requirements (min 10 chars)')
    .max(2000),
});

export function DemoPage() {
  const [searchParams] = useSearchParams();
  const { publicConfig } = useAppContext();
  const storageAvailable = publicConfig.storage?.persistent !== false;

  const initialSlug = searchParams.get('product') || PRODUCTS[0].slug;
  const [form, setForm] = useState({
    productSlug: PRODUCTS.some((p) => p.slug === initialSlug) ? initialSlug : PRODUCTS[0].slug,
    fullName: '',
    organisation: '',
    email: '',
    telephone: '',
    preferredDate: '',
    preferredTime: '10:00',
    timezone: publicConfig.defaultTimezone || 'Africa/Kampala',
    organisationSize: '11 – 50 Staff',
    requirements: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    referenceNumber: string;
    timezone: string;
  } | null>(null);

  const selectedProduct = PRODUCTS.find((p) => p.slug === form.productSlug) || PRODUCTS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionInFlight.current) return;
    setErrors({});
    setSubmitError(null);

    const parsed = demoSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (v && v[0]) nextErrors[k] = v[0];
      }
      setErrors(nextErrors);
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      if (publicConfig.features.firebaseEnabled) {
        const result = await createDemoBookingInFirestore({
          ...parsed.data,
          productName: selectedProduct.name,
        });
        setConfirmation({
          referenceNumber: result.referenceNumber,
          timezone: result.timezone,
        });
        return;
      }

      const res = await fetch('/api/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          productName: selectedProduct.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not save demonstration request.');
        return;
      }
      setConfirmation({
        referenceNumber: data.referenceNumber,
        timezone: data.timezone,
      });
    } catch (err) {
      let msg = 'Unable to save your demonstration request. Please try again.';
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
        title="Book a Product Demonstration"
        description="Schedule a tailored walkthrough of DayTech SACCO, HR, HotelOS, Farm, CRM, Inventory, Meet, Finance, or WaterOps."
      />

      <section className="py-14 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Product Walkthroughs · {publicConfig.defaultTimezone}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
            Book a Product Demonstration
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Select a DayTech software platform and preferred slot in East Africa Time (Africa/Kampala). Administrators review and confirm scheduling directly.
          </p>
          {!publicConfig.features.googleCalendarEnabled && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Note: Automated Google Calendar invites are currently disabled until calendar credentials are configured; confirmation is managed via our Operations Console.
            </p>
          )}
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
                    Demonstration Request Recorded
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Your request for <strong className="text-[#0B1120] dark:text-white">{selectedProduct.name}</strong> ({confirmation.timezone}) is pending confirmation.
                  </p>
                  <div className="mt-5 p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 inline-block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Booking Reference</p>
                    <p className="font-mono text-xl font-bold text-[#2563EB] dark:text-[#06B6D4] mt-0.5">
                      {confirmation.referenceNumber}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/portal?ref=${confirmation.referenceNumber}`}
                      className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
                    >
                      Check Status in Portal
                    </Link>
                    <Link
                      to="/products"
                      className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white"
                    >
                      Back to Marketplace
                    </Link>
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
                    Persistent database storage is currently unavailable ({publicConfig.storage?.note}). Demo requests cannot be submitted until persistent storage is active.
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Select Software Product *
                  </label>
                  <select
                    value={form.productSlug}
                    onChange={(e) => setForm({ ...form, productSlug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} — {p.category} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Telephone *
                  </label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.telephone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.telephone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.preferredDate && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.preferredDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Preferred Time ({form.timezone}) *
                  </label>
                  <input
                    type="time"
                    value={form.preferredTime}
                    onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.preferredTime && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.preferredTime}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Organisation Size *
                  </label>
                  <select
                    value={form.organisationSize}
                    onChange={(e) => setForm({ ...form, organisationSize: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  >
                    <option value="1 – 10 Staff">1 – 10 Staff</option>
                    <option value="11 – 50 Staff">11 – 50 Staff</option>
                    <option value="51 – 250 Staff">51 – 250 Staff</option>
                    <option value="250+ Staff / Multi-Branch">250+ Staff / Multi-Branch</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Operational Requirements *
                  </label>
                  <textarea
                    rows={4}
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    placeholder="Share key workflows or questions you would like covered during the walkthrough..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.requirements && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.requirements}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting || !storageAvailable}
                  className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Demo Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
