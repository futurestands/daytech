import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';

export function CompanyProgrammesPage({ mode }: { mode: 'partners' | 'academy' }) {
  const partners = mode === 'partners';
  const title = partners ? 'DayTech Partners' : 'DayTech Academy';
  const description = partners
    ? 'Register interest in helping organisations evaluate, implement or support DayTech software.'
    : 'Learn. Build. Transform. Explore DayTech’s technical resources and planned product training.';

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
      <SEOHead title={title} description={description} />
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">{description}</p>
      {partners ? (
        <>
          <h2 className="mt-8 text-xl font-semibold">Who can register interest?</h2>
          <p className="mt-2 max-w-2xl">IT technicians, accountants, consultants, implementation teams and regional distributors can tell us about their experience and the organisations they serve.</p>
          <h2 className="mt-8 text-xl font-semibold">How to apply</h2>
          <p className="mt-2 max-w-2xl">Send your business name, region, relevant experience and preferred partner role. DayTech can follow up to discuss product demonstrations, training and an appropriate pilot.</p>
        </>
      ) : (
        <>
          <h2 className="mt-8 text-xl font-semibold">Learning materials</h2>
          <p className="mt-2 max-w-2xl">Free product guides and courses are planned. The existing technical articles are available now.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {['Product guides', 'Free tutorials', 'IT infrastructure', 'Networking', 'Cybersecurity', 'Software development', 'Business digitalisation', 'Artificial intelligence'].map(topic => (
              <li key={topic} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="font-semibold">{topic}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Planned learning track</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link
        to={partners ? '/partners/apply' : '/insights'}
        className="mt-8 inline-flex rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white"
      >
        {partners ? 'Register partner interest' : 'Browse technical articles'}
      </Link>
    </section>
  );
}
