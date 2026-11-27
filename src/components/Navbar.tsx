import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { useAppContext } from '../context/AppContext';
import { SERVICES } from '../data/services';
import { PRODUCTS } from '../data/products';
import { INDUSTRIES } from '../data/industries';

type MenuKey = 'services' | 'products' | 'solutions' | 'company' | null;

export function Navbar() {
  const { theme, toggleTheme } = useAppContext();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuKey>('services');
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (key: MenuKey) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

  return (
    <header
      ref={navRef}
      className="print:hidden sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          aria-label="DayTech Solutions Home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-md whitespace-nowrap shrink-0"
        >
          <BrandMark />
        </Link>

        {/* Zone 2: 5 concise single-line nav items with Mega Menus */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6">
          <button
            type="button"
            onClick={() => toggleMenu('services')}
            aria-expanded={openMenu === 'services'}
            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
              openMenu === 'services' || location.pathname.startsWith('/services')
                ? 'text-[#2563EB] dark:text-[#06B6D4]'
                : 'text-slate-700 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white'
            }`}
          >
            <span>Services</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'services' ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => toggleMenu('products')}
            aria-expanded={openMenu === 'products'}
            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
              openMenu === 'products' || location.pathname.startsWith('/products')
                ? 'text-[#2563EB] dark:text-[#06B6D4]'
                : 'text-slate-700 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white'
            }`}
          >
            <span>Products</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'products' ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => toggleMenu('solutions')}
            aria-expanded={openMenu === 'solutions'}
            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
              openMenu === 'solutions' ||
              location.pathname.startsWith('/industries') ||
              location.pathname.startsWith('/portfolio') ||
              location.pathname.startsWith('/insights')
                ? 'text-[#2563EB] dark:text-[#06B6D4]'
                : 'text-slate-700 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white'
            }`}
          >
            <span>Solutions</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'solutions' ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => toggleMenu('company')}
            aria-expanded={openMenu === 'company'}
            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
              openMenu === 'company' || location.pathname === '/about'
                ? 'text-[#2563EB] dark:text-[#06B6D4]'
                : 'text-slate-700 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white'
            }`}
          >
            <span>Company</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'company' ? 'rotate-180' : ''}`} />
          </button>

          <Link
            to="/contact"
            className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
              location.pathname === '/contact'
                ? 'text-[#2563EB] dark:text-[#06B6D4]'
                : 'text-slate-700 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white'
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Zone 3: Portal Link, Theme Affordance & Primary Action */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <Link
            to="/portal"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Client Portal
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            to="/quote"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Request a Quote
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Mega Menu Panel */}
      {openMenu && (
        <div className="hidden lg:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-7">
            {openMenu === 'services' && (
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 pr-6 border-r border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                    Engineering &amp; Consulting
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white mt-1">
                    End-to-End Technology Services
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    From custom business software and structured office networks to cybersecurity and managed support.
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline"
                    >
                      <span>View All 7 Services</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/quote"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:underline"
                    >
                      <span>Request a Project Quotation</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="col-span-8 grid grid-cols-2 gap-x-6 gap-y-3">
                  {SERVICES.map((service) => (
                    <Link
                      key={service.slug}
                      to={`/services/${service.slug}`}
                      className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                    >
                      <p className="text-sm font-semibold text-[#0B1120] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#06B6D4]">
                        {service.number}. {service.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {service.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {openMenu === 'products' && (
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 pr-6 border-r border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                    DayTech Software Ecosystem
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white mt-1">
                    Modular Sector Platforms
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    Independent, domain-focused software products engineered for cooperatives, enterprises, hospitality, agriculture, and utilities.
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline"
                    >
                      <span>Open Product Marketplace</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/demo"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:underline"
                    >
                      <span>Book a Product Demonstration</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="col-span-8 grid grid-cols-3 gap-3">
                  {PRODUCTS.map((product) => (
                    <Link
                      key={product.slug}
                      to={`/products/${product.slug}`}
                      className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                    >
                      <p className="text-sm font-semibold text-[#0B1120] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#06B6D4]">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {product.category} · {product.status}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {openMenu === 'solutions' && (
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 pr-6 border-r border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                    Industry &amp; Knowledge Hub
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white mt-1">
                    Tailored Sector Solutions
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    Explore industry-specific technology blueprints, reference architectures, and technical insights.
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    <Link to="/industries" className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline">
                      All 11 Industries →
                    </Link>
                    <Link to="/portfolio" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:underline">
                      Portfolio &amp; Reference Architectures →
                    </Link>
                    <Link to="/insights" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:underline">
                      Insights &amp; Technical Briefs →
                    </Link>
                    <Link to="/academy" className="text-sm font-medium hover:underline">DayTech Academy</Link>
                    <Link to="/partners" className="text-sm font-medium hover:underline">DayTech Partners</Link>
                  </div>
                </div>
                <div className="col-span-8 grid grid-cols-3 gap-2.5">
                  {INDUSTRIES.map((ind) => (
                    <Link
                      key={ind.slug}
                      to={`/industries/${ind.slug}`}
                      className="p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-sm font-medium text-[#0B1120] dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-[#06B6D4]"
                    >
                      {ind.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {openMenu === 'company' && (
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 pr-6 border-r border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                    DayTech Solutions
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#0B1120] dark:text-white mt-1">
                    Technology that moves business forward.
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    A Uganda-based technology partner building reliable software and digital infrastructure for Africa and global clients.
                  </p>
                </div>
                <div className="col-span-8 grid grid-cols-2 gap-4">
                  <Link to="/" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <p className="text-sm font-semibold text-[#0B1120] dark:text-white">Homepage</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Main overview and architecture highlights</p>
                  </Link>
                  <Link to="/about" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <p className="text-sm font-semibold text-[#0B1120] dark:text-white">About Us</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vision, mission, core values, and engineering standards</p>
                  </Link>
                  <Link to="/demo" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <p className="text-sm font-semibold text-[#0B1120] dark:text-white">Book a Demo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Schedule a walkthrough in East Africa Time (EAT)</p>
                  </Link>
                  <Link to="/admin" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <p className="text-sm font-semibold text-[#0B1120] dark:text-white">Operations Console</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Protected administrative workspace (/admin)</p>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] max-h-[82vh] overflow-y-auto px-4 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-medium text-[#0B1120] dark:text-white"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-medium text-[#0B1120] dark:text-white"
            >
              About Us
            </Link>
            <Link
              to="/portfolio"
              className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-medium text-[#0B1120] dark:text-white"
            >
              Portfolio
            </Link>
            <Link
              to="/insights"
              className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-medium text-[#0B1120] dark:text-white"
            >
              Insights
            </Link>
            <Link to="/academy" className="block px-3 py-2 text-sm font-medium">Academy</Link>
            <Link to="/partners" className="block px-3 py-2 text-sm font-medium">Partners</Link>
            <Link
              to="/contact"
              className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-medium text-[#0B1120] dark:text-white"
            >
              Contact
            </Link>
            <Link
              to="/portal"
              className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-medium text-[#0B1120] dark:text-white"
            >
              Client Portal
            </Link>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setMobileSection(mobileSection === 'services' ? null : 'services')}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-[#0B1120] dark:text-white"
            >
              <span>Services</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {mobileSection === 'services' && (
              <div className="mt-1 space-y-1 pl-2">
                <Link to="/services" className="block py-1.5 text-sm font-medium text-[#2563EB] dark:text-[#06B6D4]">
                  Services Overview
                </Link>
                {SERVICES.map((s) => (
                  <Link
                    key={s.slug}
                    to={`/services/${s.slug}`}
                    className="block py-1.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    {s.number}. {s.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setMobileSection(mobileSection === 'products' ? null : 'products')}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-[#0B1120] dark:text-white"
            >
              <span>Products</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {mobileSection === 'products' && (
              <div className="mt-1 space-y-1 pl-2">
                <Link to="/products" className="block py-1.5 text-sm font-medium text-[#2563EB] dark:text-[#06B6D4]">
                  Product Marketplace
                </Link>
                {PRODUCTS.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/products/${p.slug}`}
                    className="block py-1.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    {p.name} · {p.status}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setMobileSection(mobileSection === 'solutions' ? null : 'solutions')}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-[#0B1120] dark:text-white"
            >
              <span>Industries</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {mobileSection === 'solutions' && (
              <div className="mt-1 space-y-1 pl-2">
                <Link to="/industries" className="block py-1.5 text-sm font-medium text-[#2563EB] dark:text-[#06B6D4]">
                  All Industries
                </Link>
                {INDUSTRIES.map((i) => (
                  <Link
                    key={i.slug}
                    to={`/industries/${i.slug}`}
                    className="block py-1.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    {i.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 flex flex-col gap-2.5">
            <Link
              to="/quote"
              className="w-full text-center py-3 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
            >
              Request a Quote
            </Link>
            <Link
              to="/demo"
              className="w-full text-center py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
