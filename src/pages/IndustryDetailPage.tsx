import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { getIndustryBySlug } from '../data/industries';
import { SERVICES } from '../data/services';
import { PRODUCTS } from '../data/products';

export function IndustryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const industry = slug ? getIndustryBySlug(slug) : undefined;

  if (!industry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <SEOHead title="Industry Not Found" description="Requested industry solution was not found." noIndex />
        <h1 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white">
          Industry Not Found
        </h1>
        <Link
          to="/industries"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> All Industries
        </Link>
      </div>
    );
  }

  const recommendedServices = SERVICES.filter((s) =>
    industry.recommendedServiceSlugs.includes(s.slug)
  );
  const recommendedProducts = PRODUCTS.filter((p) =>
    industry.recommendedProductSlugs.includes(p.slug)
  );

  return (
    <div>
      <SEOHead title={`${industry.name} Solutions`} description={industry.summary} />

      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/industries"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#06B6D4]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Industries</span>
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Industry Solution Blueprint
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              {industry.name}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {industry.summary}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={`/quote?industry=${encodeURIComponent(industry.name)}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                <span>Request Sector Quotation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/demo"
                className="px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
              Common Operational Needs
            </h2>
            <ul className="mt-4 space-y-3">
              {industry.operationalNeeds.map((need) => (
                <li key={need} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <Check className="w-4 h-4 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                  <span>{need}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                How DayTech Addresses These Needs
              </h2>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {industry.daytechApproach}
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Security &amp; Governance Focus
              </p>
              <p className="mt-1 text-sm text-[#0B1120] dark:text-slate-200">
                {industry.complianceFocus}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white mb-4">
              Recommended Services
            </h2>
            <div className="space-y-3">
              {recommendedServices.map((service) => (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors"
                >
                  <p className="font-display text-base font-semibold text-[#0B1120] dark:text-white">
                    {service.number}. {service.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{service.summary}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white mb-4">
              Applicable DayTech Software Platforms
            </h2>
            <div className="space-y-3">
              {recommendedProducts.map((product) => (
                <Link
                  key={product.slug}
                  to={`/products/${product.slug}`}
                  className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {product.category} · {product.status}
                  </p>
                  <p className="mt-1 font-display text-base font-semibold text-[#0B1120] dark:text-white">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{product.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
