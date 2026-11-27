import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { PRODUCTS } from '../data/products';
import { safeProductStatus, usePublicProductStatuses } from '../lib/publicProductStatus';
import { PRODUCT_STATUSES, ProductStatus } from '../types/domain';

const STATUS_FILTERS: ('All' | ProductStatus)[] = [
  'All',
  ...PRODUCT_STATUSES,
];

export function ProductsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProductStatus>('All');
  const statuses = usePublicProductStatuses('all');

  const filtered = useMemo(() => {
    return PRODUCTS.map(product => ({ ...product, status: statuses[product.slug] ?? safeProductStatus(product.status) })).filter((prod) => {
      const matchesStatus = statusFilter === 'All' || prod.status === statusFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        prod.tagline.toLowerCase().includes(q) ||
        prod.capabilities.some((c) => c.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, statuses]);

  return (
    <div>
      <SEOHead
        title="Software Product Marketplace"
        description="Explore DayTech Solutions software products: DayTech SACCO, HR, HotelOS, Farm, CRM, Inventory, Meet, Finance, and WaterOps."
      />

      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              DayTech Product Marketplace
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              Modular software platforms engineered for independent deployment.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Each DayTech product is architected to run as an independent application in its own deployment environment. Lifecycle labels describe each product’s current public status. Planned features and illustrative previews are subject to validation.
            </p>
          </div>

          {/* Search and Lifecycle Filter Toolbar */}
          <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative w-full lg:max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products or capabilities..."
                aria-label="Search software products"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120] text-sm text-[#0B1120] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900">
              {STATUS_FILTERS.map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-[#0B1120] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-16 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-12 text-center">
              <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                No products match your current filter
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                No products currently carry the “{statusFilter}” lifecycle status or match “{query}”.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('All');
                }}
                className="mt-5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <div
                  key={product.slug}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {product.category} <span aria-hidden="true">·</span> {product.status}
                    </p>
                    <h2 className="mt-2 font-display text-xl font-bold text-[#0B1120] dark:text-white">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {product.tagline}
                    </p>

                    <ul className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {product.capabilities.slice(0, 4).map((cap) => (
                        <li key={cap}>· {cap}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <Link
                      to={`/products/${product.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>View Product</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/demo?product=${product.slug}`}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0B1120] dark:hover:text-white whitespace-nowrap shrink-0"
                    >
                      Book Demo
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
