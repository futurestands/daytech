import { useState } from 'react';

export function AdminActivityChart({ counts }: { counts: { label: string; value: number; section: string }[] }) {
  const [selection, setSelection] = useState('');
  const selected = counts.find(item => item.section === selection) ?? counts[0];
  const max = Math.max(1, ...counts.map(item => item.value));
  if (!selected) return null;
  return (
    <section aria-labelledby="activity-chart-heading" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#020617]">
      <h2 id="activity-chart-heading" className="font-display text-lg font-bold">Acquisition activity</h2>
      <div className="grid gap-2">
        {counts.map(item => (
          <button key={item.section} type="button" aria-pressed={selected.section === item.section}
            onClick={() => setSelection(item.section)}
            className="grid min-h-11 grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-slate-900">
            {item.label}
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <span className={`block h-full rounded-full ${selected.section === item.section ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ width: `${100 * item.value / max}%` }} />
            </span>
            <span className="tabular-nums">{item.value.toLocaleString('en-UG')}</span>
          </button>
        ))}
      </div>
      <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
        {selected.label} in the current data view · {selected.value.toLocaleString('en-UG')}
      </p>
    </section>
  );
}
