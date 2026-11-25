import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { INSIGHTS } from '../data/insights';
import { InsightArticle } from '../types/domain';

export function InsightsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeArticle, setActiveArticle] = useState<InsightArticle | null>(null);

  const categories = ['All', ...Array.from(new Set(INSIGHTS.map((a) => a.category)))];
  const visible =
    selectedCategory === 'All'
      ? INSIGHTS
      : INSIGHTS.filter((a) => a.category === selectedCategory);

  return (
    <div>
      <SEOHead
        title="Insights & Technical Briefs"
        description="Read engineering perspectives, Uganda Data Protection guidance, and architectural notes from DayTech Solutions."
      />

      <section className="py-14 lg:py-20 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4]">
              Insights &amp; Engineering Notes
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1120] dark:text-white">
              Practical perspectives on software, security, and infrastructure.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Technical briefs and architectural notes prepared by DayTech Solutions to help institutions plan resilient digital transformation initiatives.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 w-fit">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-slate-800 text-[#0B1120] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visible.map((article) => (
            <article
              key={article.slug}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {article.category} <span aria-hidden="true">·</span> {article.publishedLabel}{' '}
                  <span aria-hidden="true">·</span> {article.readTime}
                </p>
                <h2 className="mt-3 font-display text-xl font-bold text-[#0B1120] dark:text-white leading-snug">
                  {article.title}
                </h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {article.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(article)}
                className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline text-left"
              >
                <span>Read Technical Brief</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
        >
          <div className="max-w-2xl w-full max-h-[88vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeArticle.category} · {activeArticle.publishedLabel} · {activeArticle.readTime}
                </p>
                <h2
                  id="article-modal-title"
                  className="mt-1.5 font-display text-2xl font-bold text-[#0B1120] dark:text-white"
                >
                  {activeArticle.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close article"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {activeArticle.sections.map((sec) => (
                <div key={sec.heading}>
                  <h3 className="font-display text-lg font-semibold text-[#0B1120] dark:text-white">
                    {sec.heading}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/quote"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
              >
                Discuss Implementation
              </Link>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-[#0B1120] dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
