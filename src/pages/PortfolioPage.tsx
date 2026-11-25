import { Link } from 'react-router-dom';
import { ArrowRight, Check, FolderOpen } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { REFERENCE_ARCHITECTURES } from '../data/insights';

export function PortfolioPage() {
  return (
    <div>
      <SEOHead
        title="Portfolio & Reference Architectures"
        description="Explore DayTech Solutions documented reference architectures and verified project portfolio structure."
      />

      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Portfolio &amp; Engineering Blueprints
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
            Documented architectures and verified project delivery.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            DayTech Solutions publishes client engagements and case studies only when explicit client publication consent is granted. Below is our verified case study registry alongside documented technical blueprints.
          </p>
        </div>
      </section>

      {/* Verified Client Case Studies Slot */}
      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[#0B1120] dark:text-white mb-6">
            Verified Client Case Studies
          </h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <FolderOpen className="w-6 h-6 text-[#2563EB] dark:text-[#06B6D4] mt-1 shrink-0" />
              <div>
                <h3 className="font-display text-lg font-semibold text-[#0B1120] dark:text-white">
                  Case Study Publication Pending Client Authorisation
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  To protect client confidentiality and uphold integrity, DayTech Solutions does not display unverified logos, fabricated performance claims, or placeholder client testimonials. Verified deployments are added here once formal client sign-off is recorded.
                </p>
              </div>
            </div>
            <Link
              to="/quote"
              className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold whitespace-nowrap shrink-0"
            >
              Discuss Your Project
            </Link>
          </div>
        </div>
      </section>

      {/* Reference Architectures */}
      <section className="py-16 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1120] dark:text-white">
              DayTech Reference Architectures
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Standardised engineering blueprints used as starting foundations for client engagements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {REFERENCE_ARCHITECTURES.map((arch) => (
              <div
                key={arch.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-[#2563EB] dark:text-[#06B6D4]">
                    {arch.domain}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold text-[#0B1120] dark:text-white">
                    {arch.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {arch.summary}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {arch.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    {arch.stack.slice(0, 2).join(' · ')}
                  </span>
                  <Link
                    to="/quote"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Request Scope</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
