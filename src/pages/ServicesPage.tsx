import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Cloud,
  Code2,
  Compass,
  Cpu,
  Globe,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SERVICES } from '../data/services';

const SERVICE_ICONS = {
  Code2,
  Network,
  Cpu,
  Cloud,
  Globe,
  ShieldCheck,
  Compass,
};

export function ServicesPage() {
  return (
    <div>
      <SEOHead
        title="Technology Services"
        description="Explore DayTech Solutions services: custom software development, IT infrastructure, AI automation, cloud hosting, web solutions, cybersecurity, and IT consultancy."
      />

      <section className="py-16 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Services Overview
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              Comprehensive engineering, infrastructure, and advisory services.
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Engage DayTech Solutions for an individual discipline or an integrated digital transformation programme covering software, networking, cloud, and security.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.iconName];
            return (
              <div
                key={service.slug}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                        {service.number}.
                      </span>
                      <Icon className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4]" />
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold text-[#0B1120] dark:text-white">
                      {service.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {service.overview}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to={`/services/${service.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                      >
                        <span>View Service Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/quote?service=${encodeURIComponent(service.title)}`}
                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 lg:pt-0 lg:pl-8 lg:border-l border-slate-200 dark:border-slate-800">
                    {service.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
