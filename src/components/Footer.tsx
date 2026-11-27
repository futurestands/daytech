import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { SERVICES } from '../data/services';
import { PRODUCTS } from '../data/products';
import { useAppContext } from '../context/AppContext';

export function Footer() {
  const { publicConfig, currency, setCurrency } = useAppContext();
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="print:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            {/* Company Column */}
            <div className="lg:col-span-4 space-y-4">
              <Link to="/" className="inline-block">
                <BrandMark />
              </Link>
              <p className="text-sm font-medium text-[#0B1120] dark:text-slate-200">
                Technology that moves business forward.
              </p>
              <p className="text-sm leading-relaxed">
                Uganda-based technology company engineering intelligent software, IT infrastructure, cloud platforms, and digital transformation solutions across Africa and internationally.
              </p>
              <div className="pt-2 space-y-1 text-xs">
                <p>
                  Location: {publicConfig.officialAddress || 'Uganda · East Africa (Official street address pending publication)'}
                </p>
                {publicConfig.officialEmail && <p>Email: {publicConfig.officialEmail}</p>}
                {publicConfig.officialPhone && <p>Telephone: {publicConfig.officialPhone}</p>}
                <p>Default Timezone: {publicConfig.defaultTimezone}</p>
              </div>
            </div>

            {/* Services Links */}
            <div className="lg:col-span-3">
              <h3 className="font-display text-sm font-semibold text-[#0B1120] dark:text-white mb-4">
                Services
              </h3>
              <ul className="space-y-2.5 text-sm">
                {SERVICES.map((service) => (
                  <li key={service.slug}>
                    <Link
                      to={`/services/${service.slug}`}
                      className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors"
                    >
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products Links */}
            <div className="lg:col-span-3">
              <h3 className="font-display text-sm font-semibold text-[#0B1120] dark:text-white mb-4">
                Software Ecosystem
              </h3>
              <ul className="space-y-2.5 text-sm">
                {PRODUCTS.slice(0, 6).map((product) => (
                  <li key={product.slug}>
                    <Link
                      to={`/products/${product.slug}`}
                      className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/products"
                    className="font-medium text-[#2563EB] dark:text-[#06B6D4] hover:underline"
                  >
                    View All 9 Products →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform & Legal */}
            <div className="lg:col-span-2">
              <h3 className="font-display text-sm font-semibold text-[#0B1120] dark:text-white mb-4">
                Platform
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/about" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Industries
                  </Link>
                </li>
                <li>
                  <Link to="/portfolio" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link to="/insights" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Insights
                  </Link>
                </li>
                <li>
                  <Link to="/demo" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Book a Demo
                  </Link>
                </li>
                <li>
                  <Link to="/portal" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Client Portal
                  </Link>
                </li>
                <li>
                  <Link to="/legal/privacy" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Privacy &amp; Data Protection
                  </Link>
                </li>
                <li>
                  <Link to="/legal/terms" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <p>© {year} DayTech Solutions. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <span>Display Currency:</span>
                <select
                  id="footer-currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'UGX' | 'USD' | 'KES')}
                  aria-label="Select display currency"
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono text-[#0B1120] dark:text-slate-200"
                >
                  <option value="UGX">UGX</option>
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                </select>
              </label>
              <Link to="/contact" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4]">
                Contact Desk
              </Link>
              <Link to="/admin" className="hover:text-[#2563EB] dark:hover:text-[#06B6D4]">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Configurable Floating WhatsApp Button: rendered ONLY when official number & feature flag are configured */}
      {publicConfig.features.whatsappEnabled && publicConfig.officialWhatsApp && (
        <a
          href={`https://wa.me/${publicConfig.officialWhatsApp.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with DayTech Solutions on WhatsApp"
          className="print:hidden fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#2563EB] text-white text-sm font-semibold shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
      )}
    </>
  );
}
