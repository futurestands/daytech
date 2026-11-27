import { lazy, Suspense, useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { parseBooleanFlag } from './config/features';
import { HomePage } from './pages/HomePage';

const LiveVoiceDrawer = lazy(() => import('./components/LiveVoiceDrawer').then(module => ({ default: module.LiveVoiceDrawer })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then(module => ({ default: module.ServiceDetailPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(module => ({ default: module.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const IndustriesPage = lazy(() => import('./pages/IndustriesPage').then(module => ({ default: module.IndustriesPage })));
const IndustryDetailPage = lazy(() => import('./pages/IndustryDetailPage').then(module => ({ default: module.IndustryDetailPage })));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(module => ({ default: module.PortfolioPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(module => ({ default: module.InsightsPage })));
const QuotePage = lazy(() => import('./pages/QuotePage').then(module => ({ default: module.QuotePage })));
const DemoPage = lazy(() => import('./pages/DemoPage').then(module => ({ default: module.DemoPage })));
const CompanyProgrammesPage = lazy(() => import('./pages/CompanyProgrammesPage').then(module => ({ default: module.CompanyProgrammesPage })));
const GrowthApplicationPage = lazy(() => import('./pages/GrowthApplicationPage').then(module => ({ default: module.GrowthApplicationPage })));
const FreeToolsPage = lazy(() => import('./pages/FreeToolsPage').then(module => ({ default: module.FreeToolsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(module => ({ default: module.ContactPage })));
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage').then(module => ({ default: module.ClientPortalPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then(module => ({ default: module.LegalPage })));

function VoiceAdvisor() {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <Suspense fallback={<p role="status" className="fixed bottom-5 right-5 z-40">Loading voice advisor…</p>}>
        <LiveVoiceDrawer onClose={() => setOpen(false)} />
      </Suspense>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open DayTech Live Voice Advisor"
      className="print:hidden fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0B1120] dark:bg-[#2563EB] text-white shadow-lg border border-slate-700/60 dark:border-blue-400/40 hover:bg-slate-900 dark:hover:bg-blue-700 transition-colors"
    >
      <Radio className="w-4 h-4 text-[#06B6D4] dark:text-white" />
      <span className="text-xs sm:text-sm font-semibold">Live Voice Advisor</span>
    </button>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-mono text-xs text-[#2563EB] dark:text-[#06B6D4]">404 · Page Not Found</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-[#0B1120] dark:text-white">
        The requested page could not be found.
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        Return to the DayTech Solutions homepage or explore our services and product marketplace.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
        >
          Go Home
        </Link>
        <Link
          to="/products"
          className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-[#0B1120] dark:text-slate-100">
            {gmpQuotaExceeded && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm print:hidden">
                <span>
                  Google Maps Platform quota reached. If you are the app owner, visit{' '}
                  <a
                    href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-amber-950 hover:text-amber-800"
                  >
                    maps developer site
                  </a>{' '}
                  for instructions to update your account.
                </span>
              </div>
            )}
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<p role="status" className="p-8 text-center">Loading page…</p>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/services/:slug" element={<ServiceDetailPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/industries" element={<IndustriesPage />} />
                  <Route path="/industries/:slug" element={<IndustryDetailPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/quote" element={<QuotePage />} />
                  <Route path="/demo" element={<DemoPage />} />
                  <Route path="/partners" element={<CompanyProgrammesPage mode="partners" />} />
                  <Route path="/academy" element={<CompanyProgrammesPage mode="academy" />} />
                  <Route path="/product-interest" element={<GrowthApplicationPage />} />
                  <Route path="/partners/apply" element={<GrowthApplicationPage partner />} />
                  <Route path="/tools" element={<FreeToolsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/portal" element={<ClientPortalPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/legal/privacy" element={<LegalPage mode="privacy" />} />
                  <Route path="/legal/terms" element={<LegalPage mode="terms" />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            {parseBooleanFlag(import.meta.env.VITE_FEATURE_LIVE_VOICE, true) && <VoiceAdvisor />}
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
