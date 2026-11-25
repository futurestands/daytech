import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { getServiceBySlug, SERVICES } from '../data/services';

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getServiceBySlug(slug) : undefined;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <SEOHead title="Service Not Found" description="Requested service page was not found." noIndex />
        <h1 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white">
          Service Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          The requested technology service does not exist or has moved.
        </p>
        <Link
          to="/services"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div>
      <SEOHead title={service.title} description={service.summary} />

      {/* Header */}
      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#06B6D4]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Services</span>
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              {service.number}. DayTech Practice Area
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              {service.title}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {service.overview}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={`/quote?service=${encodeURIComponent(service.title)}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                <span>Request a Quotation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="px-5 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Schedule Technical Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities, Benefits & Target Customers */}
      <section className="py-16 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
              Core Service Capabilities
            </h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {service.features.map((feat) => (
                <div key={feat} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <h3 className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 font-display text-lg font-bold text-[#0B1120] dark:text-white">
              Business Benefits
            </h3>
            <ul className="mt-4 space-y-2.5">
              {service.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-[#06B6D4] mt-0.5 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
              <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                Target Organisations
              </h2>
              <ul className="mt-4 space-y-2.5">
                {service.targetCustomers.map((customer) => (
                  <li key={customer} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-[#2563EB] dark:text-[#06B6D4]" aria-hidden="true">·</span>
                    <span>{customer}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
              <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                Implementation Approach
              </h2>
              <ol className="mt-4 space-y-4">
                {service.implementationApproach.map((item, idx) => (
                  <li key={item.step} className="flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4] mt-0.5">
                      0{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0B1120] dark:text-white">{item.step}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
            {service.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.question} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
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

      {/* Related Services */}
      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white mb-5">
            Explore Other Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SERVICES.filter((s) => s.slug !== service.slug)
              .slice(0, 3)
              .map((other) => (
                <Link
                  key={other.slug}
                  to={`/services/${other.slug}`}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors"
                >
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{other.number}.</p>
                  <p className="mt-1 font-display text-base font-semibold text-[#0B1120] dark:text-white">
                    {other.title}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
