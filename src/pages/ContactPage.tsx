import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { z } from 'zod';
import { SEOHead } from '../components/SEOHead';
import { useAppContext } from '../context/AppContext';
import { createContactMessageInFirestore } from '../lib/firebase/firestoreService';

const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  organisation: z.string().trim().max(150).optional(),
  email: z.string().trim().email('Valid email address is required').max(160),
  subject: z.string().trim().min(3, 'Subject is required').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
});

export function ContactPage() {
  const { publicConfig } = useAppContext();
  const storageAvailable = publicConfig.storage?.persistent !== false;
  const [form, setForm] = useState({
    fullName: '',
    organisation: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (v && v[0]) nextErrors[k] = v[0];
      }
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (publicConfig.features.firebaseEnabled) {
        const result = await createContactMessageInFirestore(parsed.data);
        if (publicConfig.storage?.provider === 'firestore+local') {
          fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...parsed.data, referenceNumber: result.referenceNumber }),
          }).catch(() => undefined);
        }
        setReferenceNumber(result.referenceNumber);
        setForm({ fullName: '', organisation: '', email: '', subject: '', message: '' });
        return;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not save message.');
        return;
      }
      setReferenceNumber(data.referenceNumber);
      setForm({ fullName: '', organisation: '', email: '', subject: '', message: '' });
    } catch (err) {
      let msg = 'Unable to save contact message. Please try again.';
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
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SEOHead
        title="Contact Us"
        description="Contact DayTech Solutions in Uganda for software engineering, IT infrastructure, cloud hosting, and technical advisory enquiries."
      />

      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Contact Desk
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
            Connect with DayTech Solutions.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Reach our engineering and advisory desk directly through the form below, or initiate a structured project quotation or product demonstration.
          </p>
        </div>
      </section>

      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                Official Channels &amp; Coverage
              </h2>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1120] dark:text-white">
                    Primary Operations Base
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {publicConfig.officialAddress ||
                      'Uganda · East Africa (Official office street address configurable in System Settings)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1120] dark:text-white">
                    Official Email
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {publicConfig.officialEmail || 'Pending environment configuration (use form to reach desk)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1120] dark:text-white">
                    Telephone &amp; WhatsApp Business
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {publicConfig.officialPhone || 'Pending official telephone line publication'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1120] dark:text-white">
                    Operating Timezone
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {publicConfig.defaultTimezone} (EAT · UTC+3)
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
              <h3 className="font-display text-base font-bold text-[#0B1120] dark:text-white">
                Looking for a Specific Action?
              </h3>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  to="/quote"
                  className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold text-center"
                >
                  Request a Detailed Quotation
                </Link>
                <Link
                  to="/demo"
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white text-center"
                >
                  Book a Product Demonstration
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {referenceNumber ? (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#020617] p-8">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                <h2 className="mt-3 font-display text-2xl font-bold text-[#0B1120] dark:text-white">
                  Message Saved
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Thank you for contacting DayTech Solutions. Your message reference is{' '}
                  <span className="font-mono font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                    {referenceNumber}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setReferenceNumber(null)}
                  className="mt-5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 space-y-5"
              >
                <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                  Send a General Enquiry
                </h2>

                {!storageAvailable && (
                  <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Persistent storage is currently unavailable ({publicConfig.storage?.note}).
                    </span>
                  </div>
                )}

                {submitError && (
                  <div className="p-3.5 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Organisation
                    </label>
                    <input
                      type="text"
                      value={form.organisation}
                      onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                    />
                  </div>
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
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1120] dark:text-slate-200 mb-1.5">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white"
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !storageAvailable}
                  className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
