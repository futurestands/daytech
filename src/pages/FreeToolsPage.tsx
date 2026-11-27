import { useState } from 'react';
import qrcode from 'qrcode-generator';
import { SEOHead } from '../components/SEOHead';
import { Link } from 'react-router-dom';

const field = 'block w-full rounded border border-slate-400 bg-transparent px-3 py-2';
const action = 'rounded bg-blue-700 px-4 py-2 font-semibold text-white';
const amounts = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 2 });

export function FreeToolsPage() {
  const [profit, setProfit] = useState<number | null>(null);
  const [qr, setQr] = useState('');
  const [qrError, setQrError] = useState('');
  const [invoice, setInvoice] = useState<{ business: string; customer: string; number: string; item: string; amount: number } | null>(null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <SEOHead title="Free business tools" description="Create an ordinary invoice, estimate your profit or generate a QR code in your browser." />
      <div className="print:hidden">
        <h1 className="font-display text-4xl font-bold">Free business tools</h1>
        <p className="mt-3">The tools run in this browser. DayTech does not receive the details you enter.</p>
        <div className="mt-7 grid items-start gap-5 lg:grid-cols-3">
          <form className="grid gap-3 rounded-xl border border-slate-300 p-5 dark:border-slate-700" onSubmit={event => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setProfit(Number(data.get('revenue')) - Number(data.get('costs')));
          }}>
            <h2 className="text-xl font-bold">Profit calculator</h2>
            <label>Revenue (UGX)<input className={field} name="revenue" type="number" min="0" max="1000000000000" step="0.01" required /></label>
            <label>Costs (UGX)<input className={field} name="costs" type="number" min="0" max="1000000000000" step="0.01" required /></label>
            <button className={action}>Calculate profit</button>
            {profit !== null && <output aria-live="polite">{profit < 0 ? 'Loss' : 'Profit'}: UGX {amounts.format(Math.abs(profit))}</output>}
          </form>

          <form className="grid gap-3 rounded-xl border border-slate-300 p-5 dark:border-slate-700" onSubmit={event => {
            event.preventDefault();
            const payload = String(new FormData(event.currentTarget).get('payload')).trim();
            if (!payload) { setQrError('Enter text or a URL.'); setQr(''); return; }
            try {
              const code = qrcode(0, 'M');
              qrcode.stringToBytes = value => [...new TextEncoder().encode(value)];
              code.addData(payload);
              code.make();
              setQr(code.createDataURL(7, 28));
              setQrError('');
            } catch { setQrError('This text is too long to encode.'); setQr(''); }
          }}>
            <h2 className="text-xl font-bold">QR code generator</h2>
            <label>Text or URL<textarea className={field} name="payload" maxLength={400} required /></label>
            <button className={action}>Generate QR code</button>
            {qrError && <p role="alert">{qrError}</p>}
            {qr && <><img src={qr} alt="QR code for the entered text" width="220" height="220" /><a href={qr} download="daytech-qr.gif" className="underline">Download QR image</a></>}
          </form>

          <form className="grid gap-3 rounded-xl border border-slate-300 p-5 dark:border-slate-700" onSubmit={event => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const text = (name: string) => String(data.get(name)).trim();
            setInvoice({ business: text('business'), customer: text('customer'), number: text('number'), item: text('item'), amount: Number(data.get('amount')) });
          }}>
            <h2 className="text-xl font-bold">Invoice generator</h2>
            <p className="text-sm">Ordinary business invoice for record-keeping. This tool does not issue statutory or EFRIS-certified tax invoices.</p>
            {[['business','Business name'],['customer','Customer name'],['number','Invoice number'],['item','Description']].map(([name, label]) =>
              <label key={name}>{label}<input className={field} name={name} maxLength={140} required /></label>)}
            <label>Amount (UGX)<input className={field} name="amount" type="number" min="0.01" max="1000000000000" step="0.01" required /></label>
            <button className={action}>Preview invoice</button>
          </form>
        </div>
        <Link to="/products/finance" className="mt-6 inline-block underline">Explore the planned DayTech Finance product</Link>
      </div>
      {invoice && <section className="mt-7 rounded-xl bg-white p-8 text-slate-900 print:m-0 print:p-0">
        <h2 className="text-2xl font-bold">Invoice {invoice.number}</h2>
        <p className="mt-4">From {invoice.business}</p>
        <p>Bill to {invoice.customer}</p>
        <p className="mt-5 border-t pt-3">{invoice.item} · UGX {amounts.format(invoice.amount)}</p>
        <p className="mt-4 text-sm">Ordinary business invoice</p>
        <button type="button" onClick={() => window.print()} className={action + ' mt-4 print:hidden'}>Print or save as PDF</button>
      </section>}
    </main>
  );
}
