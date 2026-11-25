import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ImageWithFallback } from '../components/ImageWithFallback';

const CORE_VALUES = [
  {
    name: 'Innovation',
    detail: 'Applying practical modern engineering, AI, and cloud tooling to solve real operational bottlenecks.',
  },
  {
    name: 'Integrity',
    detail: 'Transparent pricing, honest system readiness disclosures, and responsible handling of client data.',
  },
  {
    name: 'Excellence',
    detail: 'Clean architecture, documented codebases, and thorough testing across every software and network project.',
  },
  {
    name: 'Reliability',
    detail: 'Systems designed to stay dependable under real-world regional power, bandwidth, and hardware conditions.',
  },
  {
    name: 'Customer focus',
    detail: 'Listening closely to institutional workflows and measuring success by staff adoption and operational impact.',
  },
  {
    name: 'Continuous improvement',
    detail: 'Iterating alongside our clients as regulatory standards, business scale, and security threats evolve.',
  },
];

export function AboutPage() {
  return (
    <div>
      <SEOHead
        title="About Us"
        description="Learn about DayTech Solutions, a Uganda-based technology company delivering software, IT infrastructure, AI, and cloud transformation across Africa."
      />

      <section className="py-16 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              About DayTech Solutions
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              Technology. Innovation. Impact.
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              DayTech Solutions is a Uganda-based technology company built to serve clients across Africa and internationally. We combine software engineering, IT infrastructure, artificial intelligence, business automation, cloud computing, and cybersecurity into dependable digital transformation partnerships.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[280px]">
              <ImageWithFallback
                src="/src/assets/images/about_kampala_workspace_1795598739080.jpg"
                alt="DayTech Solutions engineering collaboration studio"
                className="w-full h-full lg:h-full object-cover"
                fallbackLabel="DayTech Engineering Studio"
              />
            </div>
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] p-7 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Our Vision
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    To become a leading provider of innovative, reliable and accessible technology solutions across Africa.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    Our Mission
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    To empower businesses, institutions and individuals through intelligent, secure and affordable digital solutions.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/quote"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline"
                >
                  <span>Discuss a Project With Our Team</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Core Values
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#0B1120] dark:text-white">
              Principles guiding every engagement.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_VALUES.map((value, idx) => (
              <div
                key={value.name}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6"
              >
                <span className="font-mono text-xs text-[#2563EB] dark:text-[#06B6D4]">
                  0{idx + 1}.
                </span>
                <h3 className="mt-2 font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  {value.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {value.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1120] dark:text-white">
              Built for regional reality and international portability.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Every software system and network topology we architect is engineered for longevity. We avoid proprietary lock-in, support Uganda Shillings (UGX) alongside multi-currency operations, enforce role-based access control aligned with Uganda’s Data Protection and Privacy Act, and optimise interfaces for everyday Android hardware and variable mobile networks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/services"
                className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Explore Our Services
              </Link>
              <Link
                to="/products"
                className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                View Product Ecosystem
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <ImageWithFallback
              src="/src/assets/images/infra_network_rack_1795598739618.jpg"
              alt="Structured enterprise server and network infrastructure"
              className="w-full h-64 object-cover"
              fallbackLabel="Enterprise Network Infrastructure"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
