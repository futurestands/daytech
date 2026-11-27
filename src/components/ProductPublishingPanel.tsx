import { useEffect, useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { PRODUCTS } from '../data/products';
import { PRODUCT_STATUSES } from '../types/domain';

export function ProductPublishingPanel() {
  const { getIdToken, isSuperAdmin } = useFirebase();
  const [slug, setSlug] = useState('inventory');
  const [draft, setDraft] = useState('');
  const [savedDraft, setSavedDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [phase, setPhase] = useState('Loading');
  const [notice, setNotice] = useState('');
  const [origin, setOrigin] = useState('');
  const [approvePricing, setApprovePricing] = useState(false);

  async function request(product: string, action = '', init?: RequestInit) {
    return fetch('/api/admin/product-drafts/' + product + action, {
      ...init,
      headers: { Authorization: 'Bearer ' + await getIdToken(), 'Content-Type': 'application/json' },
    });
  }

  async function load(product: string, signal?: AbortSignal) {
    try {
      const response = await request(product, '', { signal });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (signal?.aborted) return;
      const item = PRODUCTS.find(entry => entry.slug === product)!;
      const payload = JSON.stringify(result.draft || {
        description: item.overview, status: item.status, capabilities: [], releaseVersion: '',
        evidence: '', launchUrl: '', pricing: [],
      }, null, 2);
      setDraft(payload);
      setSavedDraft(payload);
      setVersion(result.version || null);
      setPhase(result.phase || 'New');
    } catch {
      if (!signal?.aborted) { setPhase('Unavailable'); setDraft(''); }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setPhase('Loading');
    setNotice('');
    setOrigin('');
    setApprovePricing(false);
    void load(slug, controller.signal);
    return () => controller.abort();
  }, [slug, getIdToken]);

  async function save(action: string) {
    if (busy || (action !== 'save' && draft !== savedDraft)) return;
    setBusy(true);
    try {
      const body = action === 'save' ? { draft: JSON.parse(draft), version }
        : { version, approval: { approvedOrigin: origin, approvePricing } };
      const response = await request(slug, action === 'save' ? '' : '/' + action, {
        method: action === 'save' ? 'PUT' : 'POST', body: JSON.stringify(body),
      });
      if (!response.ok) {
        const issue = await response.json().catch(() => null);
        throw new Error(issue?.error || 'Unable to update this product. Reload the latest draft.');
      }
      setNotice('Product workflow updated.');
      await load(slug);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update product.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
      <h2 className="font-display text-xl font-bold">Protected product publishing</h2>
      <label>Product <select disabled={busy} value={slug} onChange={event => setSlug(event.target.value)}>
        {PRODUCTS.map(product => <option key={product.slug} value={product.slug}>{product.name}</option>)}
      </select></label>
      <p>Stage: {phase}</p>
      {notice && <p role="status">{notice}</p>}
      <p className="text-sm">Use a lifecycle value from {PRODUCT_STATUSES.join(', ')}. An empty pricing proposal keeps catalogue prices. Pricing entries use name, cadence, currency, amount, implementationFee, optionalServices, supportLimits and effectiveDate.</p>
      {draft && <>
        <label className="block">Private draft JSON<textarea disabled={busy} value={draft} onChange={event => setDraft(event.target.value)} rows={14} className="mt-1 w-full rounded border border-slate-400 bg-transparent p-2 font-mono text-sm" /></label>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => void save('save')} className="underline">Save as draft</button>
          {phase === 'Draft' && <button type="button" disabled={busy || draft !== savedDraft} onClick={() => void save('review')} className="underline">Submit for review</button>}
          {isSuperAdmin && phase === 'Review' && <>
            <label>Approved HTTPS origin <input value={origin} onChange={event => setOrigin(event.target.value)} className="border" placeholder="https://approved.example" /></label>
            <label><input type="checkbox" checked={approvePricing} onChange={event => setApprovePricing(event.target.checked)} /> Approve this price proposal</label>
            <button type="button" disabled={busy || draft !== savedDraft} onClick={() => void save('approve')} className="underline">Approve reviewed draft</button>
          </>}
          {isSuperAdmin && phase === 'Approved' && <button type="button" disabled={busy || draft !== savedDraft} onClick={() => void save('publish')} className="underline">Publish approved release</button>}
        </div>
      </>}
    </section>
  );
}
