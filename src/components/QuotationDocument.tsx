import { formatCurrencyValue } from '../data/products';
import { PublicConfig, QuotationItemRecord, QuotationRecord } from '../types/domain';
import { BrandMark } from './BrandMark';

interface QuotationDocumentProps {
  quotation: QuotationRecord;
  items: QuotationItemRecord[];
  publicConfig: PublicConfig;
}

export function QuotationDocument({
  quotation,
  items,
  publicConfig,
}: QuotationDocumentProps) {
  const issueDate = quotation.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

  const validDate = quotation.validUntil
    ? new Date(`${quotation.validUntil}T00:00:00`).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : quotation.validUntil;

  return (
    <article className="bg-white text-[#0B1120] p-6 sm:p-10 rounded-xl border border-slate-200 print:border-0 print:rounded-none print:p-0 space-y-8">
      {/* Header Band */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-[#0B1120]">
        <div className="space-y-2">
          <div className="text-[#0B1120]">
            <BrandMark />
          </div>
          <p className="text-xs font-medium text-slate-600">
            Technology that moves business forward.
          </p>
          <div className="text-xs text-slate-600 space-y-0.5 pt-1">
            <p>{publicConfig.officialAddress || 'Kampala, Uganda · East Africa'}</p>
            {publicConfig.officialEmail && <p>Email: {publicConfig.officialEmail}</p>}
            {publicConfig.officialPhone && <p>Tel: {publicConfig.officialPhone}</p>}
          </div>
        </div>

        <div className="sm:text-right space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Customer Quotation
          </p>
          <p className="font-mono text-2xl font-bold text-[#0B1120] tabular-nums">
            {quotation.quotationNumber}
          </p>
          <div className="text-xs text-slate-600 space-y-0.5 tabular-nums">
            <p>
              Issue Date: <span className="font-medium text-[#0B1120]">{issueDate}</span>
            </p>
            <p>
              Valid Until: <span className="font-medium text-[#0B1120]">{validDate}</span>
            </p>
            <p>
              Status: <span className="font-mono font-semibold text-[#2563EB]">{quotation.status}</span>
            </p>
            {quotation.enquiryId && (
              <p>
                Enquiry Ref: <span className="font-mono text-[#0B1120]">{quotation.enquiryId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prepared For / Prepared By */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Prepared For
          </p>
          <p className="font-display text-base font-bold text-[#0B1120]">
            {quotation.clientOrganisation}
          </p>
          <p className="text-sm font-medium text-slate-800">{quotation.clientName}</p>
          <p className="text-xs text-slate-600">{quotation.clientEmail}</p>
          {quotation.clientTelephone && (
            <p className="text-xs text-slate-600 font-mono">{quotation.clientTelephone}</p>
          )}
          {quotation.clientCountry && (
            <p className="text-xs text-slate-600">{quotation.clientCountry}</p>
          )}
        </div>

        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Proposal Reference &amp; Issuer
          </p>
          <p className="font-display text-base font-bold text-[#0B1120]">
            {quotation.title}
          </p>
          <p className="text-xs text-slate-600 pt-1">
            Prepared By: <span className="font-medium text-[#0B1120]">{quotation.preparedByName}</span>
          </p>
          <p className="text-xs text-slate-600">{quotation.preparedByEmail}</p>
          <p className="text-xs text-slate-600 font-mono">Currency: {quotation.currency}</p>
        </div>
      </div>

      {/* Itemised Scope & Pricing Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#0B1120] text-white text-xs">
              <th className="py-3 px-3.5 font-semibold w-10">#</th>
              <th className="py-3 px-3.5 font-semibold">Scope Item &amp; Deliverables</th>
              <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Category</th>
              <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">Qty</th>
              <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Unit</th>
              <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">Unit Price</th>
              <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-xs text-slate-500">
                  No line items attached to this quotation.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx} className="align-top">
                  <td className="py-3 px-3.5 font-mono text-xs text-slate-500 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-3.5">
                    <p className="font-semibold text-[#0B1120]">{item.description}</p>
                    {item.details && (
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.details}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                    {item.itemType}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs text-[#0B1120] tabular-nums whitespace-nowrap">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                    {item.unit}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs text-[#0B1120] tabular-nums whitespace-nowrap">
                    {formatCurrencyValue(item.unitPrice, quotation.currency)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs font-semibold text-[#0B1120] tabular-nums whitespace-nowrap">
                    {formatCurrencyValue(item.lineTotal, quotation.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Summary + Terms */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment Terms
            </p>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {quotation.paymentTerms}
            </p>
          </div>
          {quotation.notes && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Technical Assumptions &amp; Notes
              </p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {quotation.notes}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-[#0B1120] tabular-nums">
              {formatCurrencyValue(quotation.subtotal, quotation.currency)}
            </span>
          </div>
          {quotation.discountPercent > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Discount ({quotation.discountPercent}%)</span>
              <span className="font-mono text-emerald-700 tabular-nums">
                -{formatCurrencyValue(quotation.discountAmount, quotation.currency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>VAT / Tax ({quotation.taxPercent}%)</span>
            <span className="font-mono text-[#0B1120] tabular-nums">
              {formatCurrencyValue(quotation.taxAmount, quotation.currency)}
            </span>
          </div>
          <div className="pt-2.5 border-t border-slate-300 flex items-center justify-between">
            <span className="font-display font-bold text-[#0B1120]">Total Payable</span>
            <span className="font-mono text-lg font-bold text-[#2563EB] tabular-nums">
              {formatCurrencyValue(quotation.totalAmount, quotation.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Formal Acceptance Sign-Off Block */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-600">
        <div className="space-y-6">
          <p className="font-semibold text-[#0B1120]">Authorised by DayTech Solutions</p>
          <div className="border-b border-slate-300 pb-1">
            {quotation.preparedByName} · {quotation.preparedByEmail}
          </div>
          <p className="text-[11px] text-slate-500">Signature &amp; Date</p>
        </div>
        <div className="space-y-6">
          <p className="font-semibold text-[#0B1120]">
            Client Acceptance ({quotation.clientOrganisation})
          </p>
          <div className="border-b border-slate-300 pb-1">
            {quotation.status === 'Accepted'
              ? `Accepted digitally via Client Portal (${quotation.clientName})`
              : 'Name, Title & Authorised Signature'}
          </div>
          <p className="text-[11px] text-slate-500">
            {quotation.status === 'Accepted'
              ? `Updated: ${new Date(quotation.updatedAt).toLocaleDateString('en-GB')}`
              : 'Acceptance Date / Official Stamp'}
          </p>
        </div>
      </div>
    </article>
  );
}
