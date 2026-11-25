import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';

interface LegalPageProps {
  mode: 'privacy' | 'terms';
}

export function LegalPage({ mode }: LegalPageProps) {
  const isPrivacy = mode === 'privacy';

  return (
    <div>
      <SEOHead
        title={isPrivacy ? 'Privacy & Data Protection Policy' : 'Terms of Service'}
        description={
          isPrivacy
            ? 'DayTech Solutions data protection and privacy practices aligned with Uganda’s Data Protection and Privacy Act.'
            : 'Terms of service governing use of the DayTech Solutions website and digital platform.'
        }
      />

      <section className="py-14 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Governance &amp; Legal Notice · Draft Template for Legal Review
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#0B1120] dark:text-white">
            {isPrivacy ? 'Privacy & Data Protection Policy' : 'Terms of Service'}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Jurisdiction Reference: Republic of Uganda (including Uganda’s Data Protection and Privacy Act, 2019). This document contains structured placeholders prepared for formal legal counsel sign-off prior to commercial launch.
          </p>
        </div>
      </section>

      <section className="py-14 bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {isPrivacy ? (
            <>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  1. Purpose of Collection &amp; Lawful Basis
                </h2>
                <p className="mt-2">
                  DayTech Solutions collects contact and project scoping information strictly when voluntarily submitted through quotation requests, product demonstration bookings, or support enquiries, and solely upon explicit user consent.
                </p>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  2. Data Minimisation &amp; Access Control
                </h2>
                <p className="mt-2">
                  Submitted enquiries are stored with unique reference numbers and accessed exclusively by authorised personnel under role-based access controls. Public users and search engines are restricted from indexing client records or administrative views.
                </p>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  3. Retention, Correction &amp; Deletion Rights
                </h2>
                <p className="mt-2">
                  In alignment with Uganda’s Data Protection and Privacy Act, data subjects may request access to, correction of, or deletion of personal contact records held by DayTech Solutions via our{' '}
                  <Link to="/contact" className="text-[#2563EB] dark:text-[#06B6D4] underline">
                    Contact Desk
                  </Link>
                  .
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  1. Platform Scope &amp; Indicative Information
                </h2>
                <p className="mt-2">
                  Product workspace previews shown on this website are illustrative demonstrations using sample data. Indicative pricing plans and software lifecycle statuses (such as Under Development or Coming Soon) are subject to formal written quotation agreements.
                </p>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  2. Acceptable Use &amp; Security
                </h2>
                <p className="mt-2">
                  Users must not attempt unauthorised access to administrative endpoints, submit automated spam enquiries, or probe platform infrastructure.
                </p>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1120] dark:text-white">
                  3. Governing Law
                </h2>
                <p className="mt-2">
                  These terms are structured for governance under the laws of the Republic of Uganda, subject to final legal review and signed client service agreements.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
