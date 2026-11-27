import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { getProductBySlug, PRODUCTS } from '../data/products';

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-[#0B1120]';

export function GrowthApplicationPage({ partner = false }: { partner?: boolean }) {
  const [params] = useSearchParams();
  const [state, setState] = useState<'idle' | 'saving' | 'received'>('idle');
  const [error, setError] = useState('');
  const title = partner ? 'Apply to become a DayTech partner' : 'Register for early access';

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <SEOHead title={title} description="Tell DayTech about your organisation and the work you want to do." />
      <Link to={partner ? '/partners' : '/products'} className="text-sm font-semibold text-blue-700 dark:text-cyan-300">
        {partner ? 'DayTech Partners' : 'DayTech Products'}
      </Link>
      <h1 className="mt-3 font-display text-4xl font-bold">{title}</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        {partner ? 'Tell us about your experience and the markets you serve.' : 'Tell us which product interests you and what problem you want it to solve.'}
      </p>
      {state === 'received' ? (
        <p role="status" className="mt-6 rounded-lg border border-teal-500 p-4">Your registration has been received. DayTech may contact you about the opportunity you selected.</p>
      ) : (
        <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={async event => {
          event.preventDefault();
          if (state === 'saving') return;
          const form = new FormData(event.currentTarget);
          const values = Object.fromEntries(form);
          setState('saving');
          setError('');
          try {
            const response = await fetch('/api/growth/' + (partner ? 'partner' : 'interest'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...values, consent: form.has('consent'), ...(partner ? {} : { pilot: form.has('pilot') }) }),
            });
            const result = await response.json();
            if (!response.ok || !result.received) throw new Error(result.error || 'Could not confirm your registration.');
            setState('received');
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : 'Could not confirm your registration.');
            setState('idle');
          }
        }}>
          {[
            ['name', 'Full name', 'text', 120, true],
            ['organisation', 'Organisation', 'text', 150, true],
            ['email', 'Email', 'email', 160, true],
            ['phone', 'Telephone (optional)', 'tel', 40, false],
            ...(partner ? [
              ['region', 'Geographical coverage', 'text', 120, true],
              ['role', 'Preferred partner role', 'text', 100, true],
            ] : [
              ['category', 'Business category', 'text', 100, true],
              ['size', 'Organisation size (optional)', 'text', 50, false],
            ]),
          ].map(([name, label, type, maxLength, required]) => (
            <label key={String(name)} className="text-sm font-medium">{label}
              <input className={inputClass} name={String(name)} type={String(type)} maxLength={Number(maxLength)} required={Boolean(required)} />
            </label>
          ))}
          {!partner && <label className="text-sm font-medium sm:col-span-2">Product
            <select name="product" required defaultValue={getProductBySlug(params.get('product') || '')?.slug || ''} className={inputClass}>
              <option value="">Choose a product</option>
              {PRODUCTS.filter(product => product.status !== 'Retired').map(product => <option key={product.slug} value={product.slug}>{product.name}</option>)}
            </select>
          </label>}
          <label className="text-sm font-medium sm:col-span-2">{partner ? 'Relevant professional experience' : 'Operational challenges'}
            <textarea className={inputClass} name={partner ? 'experience' : 'challenge'} rows={4} minLength={2} maxLength={1500} required />
          </label>
          {!partner && <label className="sm:col-span-2"><input type="checkbox" name="pilot" /> I’m interested in participating in a pilot.</label>}
          <label className="sm:col-span-2"><input type="checkbox" name="consent" required /> I agree that DayTech may contact me about this registration. <Link to="/legal/privacy" className="underline">Privacy policy</Link></label>
          {error && <p role="alert" className="sm:col-span-2 text-red-700 dark:text-red-300">{error}</p>}
          <button disabled={state === 'saving'} className="rounded-lg bg-[#2563EB] px-4 py-3 font-semibold text-white disabled:opacity-60">
            {state === 'saving' ? 'Submitting…' : partner ? 'Submit partner application' : 'Submit early-access registration'}
          </button>
        </form>
      )}
    </section>
  );
}
