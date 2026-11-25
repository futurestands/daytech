import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { INDUSTRIES } from '../data/industries';

export function IndustriesPage() {
  return (
    <div>
      <SEOHead
        title="Industries Served"
        description="See how DayTech Solutions serves SACCOs, government institutions, SMEs, hospitality, agriculture, education, healthcare, retail, utilities, NGOs, and professional firms."
      />

      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Sector Solutions
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
            Technology aligned to the realities of eleven industries.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Explore how DayTech services and proposed software platforms address operational workflows, data security, and efficiency across Uganda and East Africa.
          </p>
        </div>
      </section>

      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRIES.map((industry) => (
            <Link
              key={industry.slug}
              to={`/industries/${industry.slug}`}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors flex flex-col justify-between"
            >
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#06B6D4]">
                  {industry.name}
                </h2>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {industry.summary}
                </p>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Compliance focus: {industry.complianceFocus}
                </p>
              </div>
              <span className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                <span>View Industry Solution</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
