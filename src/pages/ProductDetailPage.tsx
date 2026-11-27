import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProductDashboardPreview } from '../components/ProductDashboardPreview';
import { formatCurrencyValue, getProductBySlug, PRODUCTS } from '../data/products';
import { useAppContext } from '../context/AppContext';
import { CurrencyCode, ProductStatus } from '../types/domain';

type Release = {
  status: ProductStatus;
  description: string;
  capabilities: string[];
  launchUrl: string;
  pricing: { name: string; cadence: string; currency: CurrencyCode; amount: number | null; effectiveDate: string; supportLimits: string; optionalServices: string; implementationFee?: number }[];
};

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currency, setCurrency } = useAppContext();
  const catalogue = slug ? getProductBySlug(slug) : undefined;
  const [published, setPublished] = useState<{ slug: string; data: Release } | null>(null);
  useEffect(() => {
    if (!slug || !catalogue) return;
    const controller = new AbortController();
    void fetch('/api/products/' + encodeURIComponent(slug) + '/release', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data && !controller.signal.aborted) setPublished({ slug, data }); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [slug, catalogue]);

  const release = published?.slug === slug ? published?.data : undefined;
  const date = new Date().toISOString().slice(0, 10);
  const livePlans = release?.pricing.filter(plan => plan.effectiveDate <= date && plan.currency === currency) ?? [];
  const product = catalogue && (release ? {
    ...catalogue,
    status: release.status,
    overview: release.description,
    capabilities: release.capabilities,
    plans: release.status === 'Retired' ? [] : livePlans.length ? livePlans.map(plan => ({
      name: plan.name, cadence: plan.cadence, audience: 'Approved commercial plan',
      prices: { USD: null, UGX: null, KES: null, [plan.currency]: plan.amount },
      limits: [plan.supportLimits, plan.optionalServices, ...(plan.implementationFee === undefined ? [] : [
        'Implementation: ' + formatCurrencyValue(plan.implementationFee, plan.currency),
      ])].filter(Boolean),
      highlighted: false,
    })) : catalogue.plans,
  } : catalogue);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <SEOHead title="Product Not Found" description="Requested product page was not found." noIndex />
        <h1 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white">
          Product Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          The requested software product could not be located in our marketplace.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
      </div>
    );
  }

  const available = product.status === 'Available';
  const previewAction = product.status === 'Planned' ? 'Register early interest'
    : product.status === 'Private Alpha' ? 'Ask about pilot access'
    : product.status === 'Public Beta' ? 'Ask about beta access'
    : product.status === 'Maintenance' || product.status === 'Retired' ? 'Request support'
    : product.status === 'In Development' ? 'Request a preview' : 'Request a demo';
  const previewUrl = product.status === 'In Development' || available
    ? `/demo?product=${product.slug}`
    : product.status === 'Maintenance' || product.status === 'Retired' ? '/contact'
    : `/product-interest?product=${product.slug}`;
  const launchUrl = available && release?.launchUrl && URL.canParse(release.launchUrl)
    && new URL(release.launchUrl).protocol === 'https:' && product.slug !== 'waterops'
    ? release.launchUrl : null;
  const related = PRODUCTS.filter((p) => product.relatedSlugs.includes(p.slug));

  return (
    <div>
      <SEOHead title={`${product.name} – ${product.category}`} description={product.overview} />

      {/* Product Hero / Branding */}
      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#06B6D4]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Product Marketplace</span>
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="text-xs font-medium text-[#2563EB] dark:text-[#06B6D4]">
              {product.category} <span aria-hidden="true">·</span> Lifecycle Status: {product.status}
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              {product.name}
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-700 dark:text-slate-200">
              {product.tagline}
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.overview}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={previewUrl}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>{previewAction}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {product.status !== 'Retired' && <Link
                to={`/quote?product=${encodeURIComponent(product.name)}`}
                className="px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Request a Quotation
              </Link>}
              {launchUrl ? (
                <a
                  href={launchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg bg-[#0B1120] dark:bg-slate-800 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Launch Application</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 px-2">
                  Independent App Launch: Available upon release ({product.status})
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Proposed Solution */}
      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Operational Challenge
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-[#0B1120] dark:text-white">
              Problem Statement
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.problemStatement}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
            <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Architecture Response
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-[#0B1120] dark:text-white">
              Proposed Solution
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.proposedSolution}
            </p>
          </div>
        </div>
      </section>

      {product.previewData.moduleTabs.length > 0 && (
      <section className="py-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Interface Demonstration
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#0B1120] dark:text-white">
              Interactive {product.name} Dashboard Preview
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Switch between modules below to inspect the proposed operational layout. All metrics and rows shown here are sample demonstration data.
            </p>
          </div>

          <ProductDashboardPreview product={product} />
        </div>
      </section>
      )}

      {/* Features, Benefits & Target Customers */}
      <section className="py-16 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
              {available ? 'Capabilities & modules' : 'Planned capabilities'}
            </h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {product.capabilities.map((cap) => (
                <div key={cap} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
              <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                Key Operational Benefits
              </h2>
              <ul className="mt-4 space-y-2.5">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="w-4 h-4 text-[#06B6D4] mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
              <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                Target Customers
              </h2>
              <ul className="mt-4 space-y-2">
                {product.targetCustomers.map((tc) => (
                  <li key={tc} className="text-sm text-slate-600 dark:text-slate-300">
                    · {tc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {product.plans.length > 0 && (
      <section className="py-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                Indicative Subscription Tiers
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold text-[#0B1120] dark:text-white">
                Configurable Deployment Plans
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Indicative pricing shown in {currency}. Final quotations account for onboarding, training, and custom integrations.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 self-start">
              {(['UGX', 'USD', 'KES'] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                    currency === code
                      ? 'bg-white dark:bg-slate-800 text-[#0B1120] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {product.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col justify-between ${
                  plan.highlighted
                    ? 'border-[#2563EB] bg-[#F8FAFC] dark:bg-[#0B1120]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]'
                }`}
              >
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.audience}</p>

                  <div className="mt-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <p className="font-mono text-2xl font-bold text-[#0B1120] dark:text-white tabular-nums">
                      {formatCurrencyValue(plan.prices[currency], currency)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.cadence}</p>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                    {plan.limits.map((limit) => (
                      <li key={limit} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                        <span>{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={`/quote?product=${encodeURIComponent(`${product.name} (${plan.name})`)}`}
                  className={`mt-7 w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-[#2563EB] hover:bg-blue-700 text-white'
                      : 'border border-slate-300 dark:border-slate-700 text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  Request Plan Quote
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}



      {/* FAQs */}
      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white mb-6">
            Product Questions &amp; Readiness
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
            {product.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.question} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#0B1120] dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-14 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white mb-5">
            Related DayTech Platforms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                to={`/products/${rel.slug}`}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rel.category} · {rel.status}
                </p>
                <p className="mt-1.5 font-display text-base font-bold text-[#0B1120] dark:text-white">
                  {rel.name}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{rel.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
