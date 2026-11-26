import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { FirebaseProvider } from './context/FirebaseContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LiveVoiceDrawer } from './components/LiveVoiceDrawer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { IndustriesPage } from './pages/IndustriesPage';
import { IndustryDetailPage } from './pages/IndustryDetailPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { InsightsPage } from './pages/InsightsPage';
import { QuotePage } from './pages/QuotePage';
import { DemoPage } from './pages/DemoPage';
import { ContactPage } from './pages/ContactPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { AdminPage } from './pages/AdminPage';
import { LegalPage } from './pages/LegalPage';

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
        <FirebaseProvider>
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
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/portal" element={<ClientPortalPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/legal/privacy" element={<LegalPage mode="privacy" />} />
                  <Route path="/legal/terms" element={<LegalPage mode="terms" />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <LiveVoiceDrawer />
            </div>
          </BrowserRouter>
        </FirebaseProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
