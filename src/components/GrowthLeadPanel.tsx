import { useEffect, useState } from 'react';
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
  const [notice, setNotice] = useState('Loading registrations…');
  async function request(path = '', init?: RequestInit) {
    const token = await getIdToken();
    return fetch('/api/admin/growth' + path, {
      ...init,
      headers: { ...init?.headers, Authorization: 'Bearer ' + token },
    });
  }
  async function refresh() {
    try {
      const response = await request();
      if (!response.ok) throw new Error();
      setRows((await response.json()).rows);
      setNotice('');
    } catch { setNotice('Unable to load registrations.'); }
  }
  useEffect(() => { void refresh(); }, [getIdToken]);
  const filtered = rows.filter(row => (!product || (row.product || row.kind) === product) && (!from || row.createdAt >= from));

  function exportCsv() {
    const cell = (value: string) => '"' + (/^[\s=+\-@]/.test(value) ? "'" : '') + value.replaceAll('"', '""') + '"';
    const lines = ['Name,Organisation,Email,Product,Status,Created', ...filtered.map(row =>
      [row.name, row.organisation, row.email, row.product || row.kind, row.status, row.createdAt].map(cell).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'daytech-registrations.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
      <h2 className="font-display text-xl font-bold">Product interest and partners</h2>
      {notice && <p role="status">{notice}</p>}
      <div className="flex flex-wrap gap-4">
        <label>Product or programme <select value={product} onChange={event => setProduct(event.target.value)}>
          <option value="">All</option>
          {[...new Set(rows.map(row => row.product || row.kind))].sort().map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label>From <input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
        {isAdmin && <button type="button" onClick={exportCsv} className="underline">Export filtered CSV</button>}
      </div>
      {demos && <p>{demos.filter(demo => (!product || demo.productSlug === product) && (!from || demo.createdAt >= from)).length} recorded demo requests in the selected period</p>}
      <p>{filtered.length} registrations · {filtered.filter(row => row.status === 'Qualified').length} qualified · {filtered.filter(row => row.status === 'Pilot invited').length} pilot invitations · {filtered.filter(row => row.status === 'Converted').length} converted</p>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {filtered.map(row => <li key={row.id} className="py-2">
          <button type="button" onClick={() => setSelected(row)} className="text-left underline">{row.organisation} · {row.product || row.kind} · {row.status}</button>
        </li>)}
      </ul>
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
