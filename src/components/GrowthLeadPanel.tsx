import { useEffect, useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useFirebase } from '../context/FirebaseContext';

interface Lead {
  id: string; version: string; kind: string; name: string; organisation: string; email: string;
  product?: string; phone?: string; region?: string; experience?: string; role?: string;
  challenge?: string; category?: string; size?: string; pilot?: boolean; status: string; assignedTo: string; notes: string; createdAt: string;
}
const values = ['New', 'Qualified', 'Follow-up', 'Pilot invited', 'Converted', 'Opted out', 'Approved', 'Rejected'];

export function GrowthLeadPanel({ demos }: { demos?: { productSlug: string; createdAt: string }[] }) {
  const { getIdToken, isAdmin } = useFirebase();
  const [rows, setRows] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [product, setProduct] = useState('');
  const [from, setFrom] = useState('');
  const [cursor, setCursor] = useState<Lead | null>(null);
  const [more, setMore] = useState(false);
  const [analytics, setAnalytics] = useState<{
    from: string; registrations: number; qualified: number; pilots: number; converted: number;
    optedOut: number; partners: number; demos: number; conversionRate: number | null;
  } | null>(null);
  const [notice, setNotice] = useState('Loading registrations…');
  async function request(path = '', init?: RequestInit) {
    const token = await getIdToken();
    return fetch('/api/admin/growth' + path, {
      ...init,
      headers: { ...init?.headers, Authorization: 'Bearer ' + token },
    });
  }
  function filters() {
    const query = new URLSearchParams();
    if (product) query.set('product', product);
    if (from) query.set('from', from);
    if (cursor) {
      query.set('cursorDate', cursor.createdAt);
      query.set('cursorId', cursor.id);
    }
    return '?' + query.toString();
  }

  async function refresh(signal?: AbortSignal) {
    try {
      const response = await request(filters(), { signal });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (signal?.aborted) return;
      setRows(data.rows);
      setMore(data.more);
      setNotice('');
    } catch { if (!signal?.aborted) setNotice('Unable to load registrations.'); }
  }
  useEffect(() => {
    const controller = new AbortController();
    setRows([]);
    setAnalytics(null);
    setSelected(null);
    setNotice('Loading registrations…');
    void refresh(controller.signal);
    return () => controller.abort();
  }, [getIdToken, product, from, cursor]);
  const filtered = rows;

  async function exportCsv() {
    try {
      const response = await request('/export' + filters());
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'daytech-registrations.csv';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setNotice('Unable to export these registrations.'); }
  }
  async function loadAnalytics() {
    const date = from || new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const params = new URLSearchParams({ from: date });
    if (product && product !== 'partner') params.set('product', product);
    try {
      const response = await request('/analytics?' + params);
      if (!response.ok) throw new Error();
      setAnalytics(await response.json());
    } catch { setNotice('Analytics unavailable. Choose a starting date within the last year.'); }
  }
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
      <h2 className="font-display text-xl font-bold">Product interest and partners</h2>
      {notice && <p role="status">{notice}</p>}
      <div className="flex flex-wrap gap-4">
        <label>Product or programme <select value={product} onChange={event => { setProduct(event.target.value); setCursor(null); }}>
          <option value="">All</option>
          {PRODUCTS.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          <option value="partner">Partner applications</option>
        </select></label>
        <label>From <input type="date" value={from} onChange={event => { setFrom(event.target.value); setCursor(null); }} /></label>
        {isAdmin && <button type="button" onClick={exportCsv} className="underline">Export current page CSV</button>}
      </div>
      {demos && <p>{demos.filter(demo => (!product || demo.productSlug === product) && (!from || demo.createdAt >= from)).length} recorded demo requests in the selected period</p>}
      <p>Current page: {filtered.length} registrations · {filtered.filter(row => row.status === 'Qualified').length} qualified · {filtered.filter(row => row.status === 'Pilot invited').length} pilot invitations · {filtered.filter(row => row.status === 'Converted').length} converted</p>
      {isAdmin && <button type="button" onClick={() => void loadAnalytics()} className="underline">Load commercial analytics</button>}
      {analytics && <div className="rounded border border-slate-300 p-3">
        <p>Cohort created since {analytics.from} (UTC). Qualification, pilot invitations, conversions and opt-outs reflect current stages.</p>
        <p>{analytics.registrations} product registrations · {analytics.qualified} qualified · {analytics.pilots} pilot invitations · {analytics.converted} converted · {analytics.optedOut} opted out</p>
        <p>{analytics.demos} demo requests · {analytics.partners} partner applications across all products · Conversion rate {analytics.conversionRate === null ? '—' : (analytics.conversionRate * 100).toFixed(1) + '%'}</p>
      </div>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {filtered.map(row => <li key={row.id} className="py-2">
          <button type="button" onClick={() => setSelected(row)} className="text-left underline">{row.organisation} · {row.product || row.kind} · {row.status}</button>
        </li>)}
      </ul>
      <div className="flex gap-4">
        <button type="button" disabled={!cursor} onClick={() => setCursor(null)}>First page</button>
        <button type="button" disabled={!more || !rows.length} onClick={() => setCursor(rows.at(-1) ?? null)}>Next page</button>
      </div>
      {selected && <form className="grid gap-3" onSubmit={async event => {
        event.preventDefault();
        try {
          const response = await request('/' + selected.id, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: selected.status, assignedTo: selected.assignedTo, notes: selected.notes, version: selected.version }),
          });
          if (!response.ok) throw new Error('Update rejected. Check your permissions and reload the registration.');
          setSelected(null);
          await refresh();
        } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to save the registration.'); }
      }}>
        <p>{selected.name} · {selected.email}{selected.phone && ' · ' + selected.phone}</p>
        {selected.kind === 'partner'
          ? <p>{selected.role} · {selected.region}<br />{selected.experience}</p>
          : <p>{selected.category}{selected.size && ' · ' + selected.size}<br />{selected.challenge}<br />{selected.pilot ? 'Interested in a pilot' : 'No pilot interest stated'}</p>}
        <label>Status <select value={selected.status} onChange={event => setSelected({ ...selected, status: event.target.value })}>
          {values.filter(value => !['Approved', 'Rejected'].includes(value) || (isAdmin && selected.kind === 'partner')).map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label>Assigned staff UID <input value={selected.assignedTo} maxLength={128} onChange={event => setSelected({ ...selected, assignedTo: event.target.value })} /></label>
        <label>Staff notes <textarea value={selected.notes} maxLength={1500} onChange={event => setSelected({ ...selected, notes: event.target.value })} /></label>
        <button className="justify-self-start rounded bg-blue-700 px-4 py-2 text-white">Save update</button>
      </form>}
    </section>
  );
}
