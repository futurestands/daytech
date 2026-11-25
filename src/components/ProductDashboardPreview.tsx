import { useState, useEffect } from 'react';
import { ProductItem } from '../types/domain';

interface ProductDashboardPreviewProps {
  product: ProductItem;
}

export function ProductDashboardPreview({ product }: ProductDashboardPreviewProps) {
  const tabs = product.previewData.moduleTabs;
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '');

  useEffect(() => {
    setActiveTabId(product.previewData.moduleTabs[0]?.id || '');
  }, [product.slug, product.previewData.moduleTabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  if (!activeTab) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden">
      {/* Top Preview Frame Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#020617] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display text-sm font-semibold text-[#0B1120] dark:text-white truncate">
            {product.name} Workspace
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-medium text-[#2563EB] dark:text-[#06B6D4] whitespace-nowrap">
            Illustrative Demonstration Preview (Sample Data)
          </span>
        </div>

        {/* Interactive Module Switcher */}
        {tabs.length > 1 && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-900">
            {tabs.map((tab) => {
              const isSelected = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-[#0B1120] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
        {activeTab.metrics.map((metric) => (
          <div key={metric.label} className="p-4 sm:p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-[#0B1120] dark:text-white tabular-nums">
              {metric.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{metric.context}</p>
          </div>
        ))}
      </div>

      {/* Structured Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs font-medium text-slate-500 dark:text-slate-400">
              <th className="py-3 px-5">{activeTab.columns[0]}</th>
              <th className="py-3 px-5">{activeTab.columns[1]}</th>
              <th className="py-3 px-5 text-right">{activeTab.columns[2]}</th>
              <th className="py-3 px-5 text-right">{activeTab.columns[3]}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {activeTab.rows.map((row) => (
              <tr
                key={row.primary}
                className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <td className="py-3.5 px-5 font-medium text-[#0B1120] dark:text-slate-100 whitespace-nowrap">
                  {row.primary}
                </td>
                <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {row.secondary}
                </td>
                <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#0B1120] dark:text-slate-200 whitespace-nowrap">
                  {row.metric}
                </td>
                <td className="py-3.5 px-5 text-right text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {row.state}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
