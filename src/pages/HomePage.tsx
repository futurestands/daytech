import { useState } from 'react';
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
import { EcosystemVisual } from '../components/EcosystemVisual';
import { ProductDashboardPreview } from '../components/ProductDashboardPreview';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { SERVICES } from '../data/services';
import { PRODUCTS } from '../data/products';
import { INDUSTRIES } from '../data/industries';
import { REFERENCE_ARCHITECTURES } from '../data/insights';

const SERVICE_ICONS = {
  Code2,
  Network,
  Cpu,
  Cloud,
  Globe,
  ShieldCheck,
  Compass,
};

const PROCESS_STEPS = [
  {
    step: '01',
    name: 'Discovery',
    detail: 'Audit workflows, regulatory constraints, connectivity realities, and operational objectives.',
  },
  {
    step: '02',
    name: 'Planning',
    detail: 'Define system architecture, milestones, security boundaries, and realistic delivery budgets.',
  },
  {
    step: '03',
    name: 'Design',
    detail: 'Craft accessible interfaces, database schemas, and modular API specifications.',
  },
  {
    step: '04',
    name: 'Development',
    detail: 'Build production-grade software and configure resilient network or cloud infrastructure.',
  },
  {
    step: '05',
    name: 'Testing',
    detail: 'Verify role permissions, mobile responsiveness, edge cases, and backup restoration.',
  },
  {
    step: '06',
    name: 'Deployment',
    detail: 'Launch safely with staff training, operational runbooks, and structured data migration.',
  },
  {
    step: '07',
    name: 'Support',
    detail: 'Deliver proactive monitoring, maintenance updates, and long-term technical partnership.',
  },
];

const WHY_DAYTECH = [
  {
    title: 'Solutions tailored to customer needs',
    description:
      'Every engagement starts from your actual operational workflow rather than forcing rigid off-the-shelf templates.',
  },
  {
    title: 'Affordable and scalable technology',
    description:
      'Modular architectures let organisations start with immediate priorities and expand capacity without expensive rewrites.',
  },
  {
    title: 'Local expertise with global standards',
    description:
      'Rooted in Uganda’s operational context—mobile money, statutory payroll, variable connectivity—built to international engineering benchmarks.',
  },
  {
    title: 'Security-focused development',
    description:
      'Role-based access control, server-side validation, audit logs, and Uganda Data Protection Act alignment built in from day one.',
  },
  {
    title: 'Reliable technical support',
    description:
      'Structured remote and onsite assistance, clear SLAs, and practical staff onboarding ensure systems stay productive.',
  },
  {
    title: 'Long-term technology partnerships',
    description:
      'We act as an enduring engineering partner through system evolution, upgrades, and institutional growth.',
  },
];

export function HomePage() {
  const [featuredSlug, setFeaturedSlug] = useState<string>('sacco');
  const [activeProcessIdx, setActiveProcessIdx] = useState<number>(0);

  const featuredProduct = PRODUCTS.find((p) => p.slug === featuredSlug) || PRODUCTS[0];
  const activeProcess = PROCESS_STEPS[activeProcessIdx];

  return (
    <div>
      <SEOHead
        title="DayTech Solutions – Technology. Innovation. Impact."
        description="DayTech Solutions delivers intelligent software, reliable IT infrastructure, cloud computing, and digital transformation across Uganda and Africa."
      />

      {/* A. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-[#2563EB] dark:text-[#06B6D4]">
                Uganda · East Africa · International Digital Engineering
              </p>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-[#0B1120] dark:text-white leading-[1.08]">
                Building Technology. Transforming Businesses. Shaping the Future.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                DayTech Solutions delivers intelligent software, reliable IT infrastructure and innovative digital solutions that empower businesses and institutions to operate smarter, grow faster and achieve lasting impact.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Our Solutions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/quote"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-900 text-[#0B1120] dark:text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Get a Free Consultation</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[280px]">
              <ImageWithFallback
                src="/src/assets/images/hero_tech_architecture_1795598738822.jpg"
                alt="DayTech enterprise technology operations and engineering architecture"
                className="w-full h-full lg:h-full object-cover"
                fallbackLabel="DayTech Engineering Command Architecture"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-[#020617]/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-mono text-[#06B6D4]">Technology. Innovation. Impact.</p>
                <p className="mt-1 text-sm font-medium text-slate-100">
                  Software Engineering · IT Infrastructure · Cloud · AI &amp; Cybersecurity
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Connected Ecosystem Visual */}
          <div className="mt-12">
            <EcosystemVisual />
          </div>
        </div>
      </section>

      {/* B. COMPANY INTRODUCTION */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[260px]">
              <ImageWithFallback
                src="/src/assets/images/about_kampala_workspace_1795598739080.jpg"
                alt="DayTech Solutions engineering team collaborating in East Africa"
                className="w-full h-full lg:h-full object-cover"
                fallbackLabel="DayTech Engineering Studio"
              />
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                Who We Are
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
                Local understanding paired with international engineering discipline.
              </h2>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Headquartered in Uganda with a vision spanning Africa and global markets, DayTech Solutions bridges the gap between everyday institutional realities and modern digital infrastructure. We understand regional payment ecosystems, statutory payroll requirements, multi-branch connectivity constraints, and regulatory governance—delivering reliable systems built to scale.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-display text-sm font-semibold text-[#0B1120] dark:text-white">
                    Our Vision
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    To become a leading provider of innovative, reliable and accessible technology solutions across Africa.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-[#0B1120] dark:text-white">
                    Our Mission
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    To empower businesses, institutions and individuals through intelligent, secure and affordable digital solutions.
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline"
                >
                  <span>Read About Our Values &amp; Approach</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. CORE SERVICES */}
      <section className="py-16 lg:py-24 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                Core Capabilities
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
                Seven integrated technology practices under one roof.
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Explore All Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((service, index) => {
              const Icon = SERVICE_ICONS[service.iconName];
              const isMarquee = index === 0;
              return (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  className={`group rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] p-6 hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors flex flex-col justify-between ${
                    isMarquee ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                        {service.number}. {service.shortTitle}
                      </span>
                      <Icon className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] shrink-0" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold text-[#0B1120] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#06B6D4] transition-colors">
                      {service.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {service.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#0B1120] dark:text-slate-200">
                    <span>{service.features.length} Core Capabilities</span>
                    <span className="inline-flex items-center gap-1 text-[#2563EB] dark:text-[#06B6D4]">
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* D. FEATURED PRODUCTS */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                DayTech Software Product Ecosystem
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
                Purpose-built software platforms for African industries.
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Inspect interactive product workspace demonstrations below. Each platform is architected to run independently with its own dedicated deployment environment.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Open Product Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Product Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6" role="tablist" aria-label="Featured DayTech Products">
            {PRODUCTS.map((prod) => {
              const active = prod.slug === featuredProduct.slug;
              return (
                <button
                  key={prod.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFeaturedSlug(prod.slug)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0B1120] dark:bg-[#2563EB] text-white'
                      : 'bg-white dark:bg-[#020617] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {prod.name}
                </button>
              );
            })}
          </div>

          {/* Selected Product Summary + Interactive Preview */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {featuredProduct.category} · Lifecycle Status: {featuredProduct.status}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-[#0B1120] dark:text-white">
                  {featuredProduct.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {featuredProduct.overview}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to={`/products/${featuredProduct.slug}`}
                  className="px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  Explore {featuredProduct.name}
                </Link>
                <Link
                  to={`/demo?product=${featuredProduct.slug}`}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Request Demo
                </Link>
              </div>
            </div>

            <ProductDashboardPreview product={featuredProduct} />
          </div>
        </div>
      </section>

      {/* E. WHY CHOOSE DAYTECH */}
      <section className="py-16 lg:py-24 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Engineering Commitments
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              Why organisations partner with DayTech Solutions.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 pt-8 border-t border-slate-200 dark:border-slate-800">
            {WHY_DAYTECH.map((item, idx) => (
              <div key={item.title}>
                <span className="font-mono text-xs text-[#2563EB] dark:text-[#06B6D4]">
                  0{idx + 1}.
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold text-[#0B1120] dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* F. INDUSTRIES SERVED */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                Industries We Support
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
                Focused operational solutions across eleven key sectors.
              </h2>
            </div>
            <Link
              to="/industries"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Browse All Industries</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRIES.map((industry) => (
              <Link
                key={industry.slug}
                to={`/industries/${industry.slug}`}
                className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] hover:border-[#2563EB] dark:hover:border-[#06B6D4] transition-colors flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display text-base font-semibold text-[#0B1120] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#06B6D4] transition-colors">
                    {industry.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {industry.summary}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                  Explore Sector Blueprint <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* G. OUR DEVELOPMENT PROCESS */}
      <section className="py-16 lg:py-24 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Delivery Methodology
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              A structured seven-stage engineering lifecycle.
            </h2>
          </div>

          {/* Interactive Process Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PROCESS_STEPS.map((stage, idx) => {
              const active = idx === activeProcessIdx;
              return (
                <button
                  key={stage.name}
                  type="button"
                  onClick={() => setActiveProcessIdx(idx)}
                  className={`p-3.5 rounded-lg border text-left transition-colors ${
                    active
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'bg-[#F8FAFC] dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 text-[#0B1120] dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`block font-mono text-xs ${
                      active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {stage.step}
                  </span>
                  <span className="mt-1 block font-display text-sm font-semibold whitespace-nowrap">
                    {stage.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-[#2563EB] dark:text-[#06B6D4]">
                Stage {activeProcess.step} of 07 · {activeProcess.name}
              </p>
              <p className="mt-1.5 text-base font-medium text-[#0B1120] dark:text-white">
                {activeProcess.detail}
              </p>
            </div>
            <Link
              to="/quote"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Start Discovery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* H. PROJECT SHOWCASE & REFERENCE ARCHITECTURES */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                Portfolio &amp; Reference Architectures
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1120] dark:text-white">
                Verified deployments and documented engineering blueprints.
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                DayTech publishes verified client case studies only with explicit client authorisation. Below are our documented reference architectures illustrating how we design production systems.
              </p>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
            >
              <span>View Portfolio Hub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {REFERENCE_ARCHITECTURES.map((arch) => (
              <div
                key={arch.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {arch.domain} · Reference Blueprint
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold text-[#0B1120] dark:text-white">
                    {arch.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {arch.summary}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {arch.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
                  {arch.stack.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* I. FINAL CALL TO ACTION */}
      <section className="py-16 lg:py-24 bg-[#0B1120] dark:bg-[#020617] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#06B6D4]">
            Start a Conversation
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Ready to Transform Your Business?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Share your project requirements for a tailored quotation, schedule a walkthrough of a DayTech software platform, or consult our engineering team directly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/quote"
              className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Request a Quotation
            </Link>
            <Link
              to="/demo"
              className="px-6 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Book a Product Demo
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-lg text-slate-300 hover:text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Contact Us →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
