import { IndustryItem } from '../types/domain';

export const INDUSTRIES: IndustryItem[] = [
  {
    slug: 'saccos-microfinance',
    name: 'SACCOs & Microfinance Institutions',
    summary:
      'Automated savings ledgers, loan appraisals, guarantor validation, Mobile Money collections, and strict financial audit trails.',
    operationalNeeds: [
      'Eliminating spreadsheet errors in share capital, dividends, and reducing-balance loan interest',
      'Enforcing maker-checker controls before any loan disbursement or member adjustment',
      'Providing branch officers and members with accurate, real-time account statements',
    ],
    daytechApproach:
      'DayTech deploys DayTech SACCO alongside hardened role-based access, automated backups, and optional MTN/Airtel collection connectors so cooperatives operate with institutional transparency.',
    recommendedServiceSlugs: ['software-development', 'cybersecurity', 'cloud-hosting'],
    recommendedProductSlugs: ['sacco', 'finance', 'hr'],
    complianceFocus:
      'UMRA reporting readiness, double-entry ledger integrity, and Uganda Data Protection Act member privacy controls.',
  },
  {
    slug: 'hospitality-tourism',
    name: 'Hospitality, Hotels & Tourism',
    summary:
      'Unified front-desk reservations, room folios, restaurant/bar POS posting, and resilient property Wi-Fi infrastructure.',
    operationalNeeds: [
      'Preventing room double-bookings and untracked restaurant/bar charges to guest rooms',
      'Supporting multi-currency folios (UGX, USD, KES) for international and regional guests',
      'Delivering stable segmented Wi-Fi for both guest rooms and back-office operations',
    ],
    daytechApproach:
      'We pair DayTech HotelOS with structured guest/corporate network architecture so front desk, housekeeping, kitchen POS, and night audits run seamlessly.',
    recommendedServiceSlugs: ['it-infrastructure', 'software-development', 'web-digital'],
    recommendedProductSlugs: ['hotelos', 'inventory', 'hr'],
    complianceFocus:
      'Guest passport/ID PII isolation, cashier shift auditability, and segregated guest Wi-Fi portals.',
  },
  {
    slug: 'agriculture-agribusiness',
    name: 'Agriculture & Agribusiness',
    summary:
      'Plot and herd cost tracking, store input controls, outgrower weigh-in logging, and seasonal margin visibility.',
    operationalNeeds: [
      'Tracking fertiliser, seed, feed, and veterinary input usage against actual block yields',
      'Recording outgrower deliveries reliably in rural zones with intermittent mobile coverage',
      'Computing fair, verifiable farmer payouts based on graded harvest weights',
    ],
    daytechApproach:
      'DayTech Farm & Agribusiness digitises collection centres, farm stores, and estate operations with offline-tolerant workflows that sync cleanly to central dashboards.',
    recommendedServiceSlugs: ['software-development', 'ai-automation', 'it-consultancy'],
    recommendedProductSlugs: ['farm', 'inventory', 'sacco'],
    complianceFocus:
      'Produce batch traceability, store shrinkage controls, and transparent farmer settlement ledgers.',
  },
  {
    slug: 'education-institutions',
    name: 'Education & Training Institutions',
    summary:
      'Campus Wi-Fi infrastructure, student/fee administration portals, staff payroll, and secure cloud backups.',
    operationalNeeds: [
      'Managing term fee schedules, bursaries, and parent payment reconciliations cleanly',
      'Providing reliable campus networking for computer labs, libraries, and administration blocks',
      'Automating teaching and support staff payroll including PAYE and NSSF deductions',
    ],
    daytechApproach:
      'We combine structured campus networking with custom academic portals, DayTech HR & Payroll, and DayTech Finance.',
    recommendedServiceSlugs: ['it-infrastructure', 'web-digital', 'software-development'],
    recommendedProductSlugs: ['hr', 'finance', 'meet'],
    complianceFocus:
      'Student record confidentiality, role-restricted grade/fee edits, and off-site disaster recovery.',
  },
  {
    slug: 'healthcare-clinics',
    name: 'Healthcare Clinics & Pharmacies',
    summary:
      'Batch-tracked pharmacy stock, clinic billing, staff shift rosters, and strict patient data security.',
    operationalNeeds: [
      'Tracking drug batches and near-expiry inventory across dispensaries and stores',
      'Separating clinical workflows, cashier billing, and administrative reporting cleanly',
      'Protecting sensitive patient records with encrypted storage and access audit logs',
    ],
    daytechApproach:
      'DayTech deploys batch/FEFO inventory tracking, hardened local networks, and privacy-first clinical or administrative applications.',
    recommendedServiceSlugs: ['cybersecurity', 'software-development', 'it-infrastructure'],
    recommendedProductSlugs: ['inventory', 'hr', 'finance'],
    complianceFocus:
      'Strict PII/health-record isolation, expiry control, and NDA / Uganda Data Protection Act safeguards.',
  },
  {
    slug: 'retail-wholesale-distribution',
    name: 'Retail, Wholesale & Distribution',
    summary:
      'Multi-branch inventory control, barcode POS, supplier purchase orders, and branch margin dashboards.',
    operationalNeeds: [
      'Stopping stock leakage across central warehouses and regional retail outlets',
      'Speeding up checkout queues with reliable barcode POS and shift reconciliation',
      'Monitoring fast-moving SKUs and supplier payables across branches',
    ],
    daytechApproach:
      'DayTech Inventory & POS links head-office procurement directly to branch sales counters, paired with DayTech Finance for clean P&L reporting.',
    recommendedServiceSlugs: ['software-development', 'cloud-hosting', 'it-infrastructure'],
    recommendedProductSlugs: ['inventory', 'finance', 'crm'],
    complianceFocus:
      'Shift variance audit trails, supplier GRN sign-offs, and branch transfer verification.',
  },
  {
    slug: 'utilities-water-energy',
    name: 'Water Schemes & Utilities',
    summary:
      'Meter reading capture, tiered tariff billing, non-revenue water tracking, and field maintenance dispatch.',
    operationalNeeds: [
      'Replacing slow paper meter books with structured mobile/field reading cycles',
      'Detecting distribution zones with excessive leakage or unbilled consumption',
      'Issuing accurate tiered customer bills and tracking burst-repair SLAs',
    ],
    daytechApproach:
      'DayTech WaterOps equips regional utilities and estate schemes with end-to-end metering, billing, NRW analysis, and maintenance ticketing.',
    recommendedServiceSlugs: ['software-development', 'cloud-hosting', 'ai-automation'],
    recommendedProductSlugs: ['waterops', 'finance', 'crm'],
    complianceFocus:
      'Tariff auditability, non-revenue water reporting, and verifiable billing adjustments.',
  },
  {
    slug: 'ngos-nonprofits',
    name: 'NGOs & Development Programmes',
    summary:
      'Grant-aligned expense approvals, programme monitoring tools, staff payroll, and secure donor reporting.',
    operationalNeeds: [
      'Tracking expenditure cleanly against donor budget lines and regional field offices',
      'Standardising staff leave, payroll, and statutory filings across project sites',
      'Protecting beneficiary PII collected during field registrations and surveys',
    ],
    daytechApproach:
      'We deliver cost-effective cloud portals, expense approval systems, and privacy-hardened field data pipelines.',
    recommendedServiceSlugs: ['it-consultancy', 'cybersecurity', 'cloud-hosting'],
    recommendedProductSlugs: ['finance', 'hr', 'meet'],
    complianceFocus:
      'Beneficiary data minimisation, donor audit trails, and role-segregated approval controls.',
  },
  {
    slug: 'real-estate-construction',
    name: 'Real Estate & Property Management',
    summary:
      'Tenant lease registers, utility sub-metering, maintenance ticketing, and automated rent invoicing.',
    operationalNeeds: [
      'Tracking lease renewals, service charges, and arrears across residential or commercial estates',
      'Managing contractor maintenance requests with clear photo and cost histories',
      'Reconciling rent receipts and utility recoveries cleanly per landlord or block',
    ],
    daytechApproach:
      'DayTech integrates tenant invoicing, utility billing, and CRM enquiry tracking into unified estate management portals.',
    recommendedServiceSlugs: ['web-digital', 'software-development', 'it-infrastructure'],
    recommendedProductSlugs: ['finance', 'crm', 'waterops'],
    complianceFocus:
      'Landlord disbursement statements, tenant contract storage, and arrears notifications.',
  },
  {
    slug: 'logistics-transport',
    name: 'Logistics, Fleet & Warehousing',
    summary:
      'Dispatch coordination, waybill tracking, warehouse stock intake, and customer SLA visibility.',
    operationalNeeds: [
      'Tracking consignments, fleet maintenance schedules, and fuel/trip expenses',
      'Eliminating paperwork delays at loading bays and regional transit depots',
      'Giving corporate clients transparent shipment milestone updates',
    ],
    daytechApproach:
      'We engineer tailored dispatch portals, warehouse barcode workflows, and automated client notification pipelines.',
    recommendedServiceSlugs: ['software-development', 'ai-automation', 'cloud-hosting'],
    recommendedProductSlugs: ['inventory', 'crm', 'finance'],
    complianceFocus:
      'Waybill chain-of-custody logs, expense verification, and branch SLA tracking.',
  },
  {
    slug: 'professional-services-smes',
    name: 'Professional Services & Corporate SMEs',
    summary:
      'Client portals, proposal/CRM pipelines, project billing, office networking, and cybersecurity governance.',
    operationalNeeds: [
      'Professionalising client onboarding, quotation tracking, and recurring retainer billing',
      'Securing shared office documents, endpoints, and hybrid remote-work access',
      'Eliminating manual spreadsheet tracking across sales, projects, and finance',
    ],
    daytechApproach:
      'DayTech deploys integrated CRM, Finance, HR, and hardened office IT infrastructure scaled cleanly to SME budgets.',
    recommendedServiceSlugs: ['it-consultancy', 'web-digital', 'cybersecurity'],
    recommendedProductSlugs: ['crm', 'finance', 'hr'],
    complianceFocus:
      'Client confidentiality boundaries, MFA enforcement, and automated off-site backups.',
  },
];

export function getIndustryBySlug(slug: string): IndustryItem | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
