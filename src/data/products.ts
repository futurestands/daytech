import { CurrencyCode, ProductItem } from '../types/domain';

export function formatCurrencyValue(amount: number | null, currency: CurrencyCode): string {
  if (amount === null) return 'Custom Quote';
  if (currency === 'UGX') {
    return `UGX ${amount.toLocaleString('en-US')}`;
  }
  if (currency === 'KES') {
    return `KES ${amount.toLocaleString('en-US')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

export const PRODUCTS: ProductItem[] = [
  {
    slug: 'sacco',
    name: 'DayTech SACCO',
    tagline: 'Core cooperative banking, member shares, loans, and automated ledger reconciliation.',
    category: 'Cooperative Finance',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A dedicated core management platform designed for SACCOs, village savings groups, and microfinance institutions to manage member registers, share capital, savings deposits, loan appraisals, guarantor checks, and mobile money collections.',
    problemStatement:
      'Many cooperatives still depend on fragmented spreadsheets or disconnected desktop ledgers—leading to interest calculation errors, slow loan approvals, weak guarantor tracking, and opaque audit trails.',
    proposedSolution:
      'DayTech SACCO unifies member onboarding, automated loan amortisation schedules, maker-checker disbursement approvals, and real-time trial balances inside a role-secured web and branch portal.',
    capabilities: [
      'Member KYC Registry & Next-of-Kin Profiles',
      'Share Capital, Compulsory & Voluntary Savings Ledgers',
      'Loan Origination, Guarantor Limits & Appraisal Workflows',
      'Automated Reducing-Balance & Flat-Rate Interest Schedules',
      'Arrears Ageing Alerts & Penalty Rules',
      'Double-Entry General Ledger & Exportable Audit Statements',
    ],
    benefits: [
      'Cuts monthly interest and dividend reconciliation from days to minutes',
      'Enforces dual-authorisation before loan disbursements or ledger adjustments',
      'Gives members transparent statement visibility',
    ],
    targetCustomers: [
      'Employee & Institutional SACCOs',
      'Agricultural & Community Cooperatives',
      'Tier-4 Microfinance Institutions',
    ],
    plans: [
      {
        name: 'Starter Cooperative',
        audience: 'Up to 500 active members · 1 branch',
        cadence: 'per month (indicative)',
        prices: { UGX: 350000, USD: 95, KES: 12500 },
        limits: ['Up to 500 members', '5 staff roles', 'Core savings & loans', 'Automated daily backup'],
      },
      {
        name: 'Growth Multi-Branch',
        audience: 'Up to 3,500 members · up to 5 branches',
        cadence: 'per month (indicative)',
        prices: { UGX: 850000, USD: 230, KES: 30000 },
        limits: ['Up to 3,500 members', '20 staff roles', 'Maker-checker approvals', 'Mobile Money API ready'],
        highlighted: true,
      },
      {
        name: 'Enterprise Union',
        audience: 'Unlimited members · custom integrations',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Unlimited branches & members', 'Dedicated cloud/on-prem instance', 'Custom regulatory exports'],
      },
    ],
    faqs: [
      {
        question: 'When will standalone DayTech SACCO accounts be open for self-service signup?',
        answer:
          'DayTech SACCO is currently in active engineering development. Interested cooperatives can book a walkthrough or join pilot onboarding through our Demo and Quotation pages.',
      },
      {
        question: 'Does it support Mobile Money repayment reconciliation?',
        answer:
          'The architecture supports MTN Mobile Money and Airtel Money collection webhooks, activated once your institution’s official merchant API credentials are provisioned.',
      },
    ],
    relatedSlugs: ['finance', 'crm', 'hr'],
    previewData: {
      moduleTabs: [
        {
          id: 'loans',
          label: 'Loan Portfolio',
          metrics: [
            { label: 'Sample Active Loans', value: '148', context: 'Illustrative demo register' },
            { label: 'Sample Principal Disbursed', value: 'UGX 412M', context: 'Reducing-balance schedule' },
            { label: 'Sample On-Time Repayment', value: '96.4%', context: 'Demo cohort metric' },
          ],
          columns: ['Loan Reference', 'Member / Group', 'Principal', 'Workflow State'],
          rows: [
            { primary: 'LN-DEMO-204', secondary: 'Kigezi Traders Group', metric: 'UGX 18,500,000', state: 'Disbursed' },
            { primary: 'LN-DEMO-209', secondary: 'Grace Tumusiime', metric: 'UGX 6,200,000', state: 'Board Review' },
            { primary: 'LN-DEMO-215', secondary: 'Ankole Agro Co-op', metric: 'UGX 24,000,000', state: 'Guarantor Check' },
          ],
        },
        {
          id: 'savings',
          label: 'Member Shares & Savings',
          metrics: [
            { label: 'Sample Registered Members', value: '620', context: 'Demo cooperative branch' },
            { label: 'Sample Share Capital', value: 'UGX 195M', context: 'Paid-up units' },
            { label: 'Sample Liquid Savings', value: 'UGX 528M', context: 'Voluntary + fixed deposits' },
          ],
          columns: ['Member ID', 'Account Holder', 'Balance', 'Tier'],
          rows: [
            { primary: 'MEM-0118', secondary: 'Samuel Mugisha', metric: 'UGX 14,800,000', state: 'Active' },
            { primary: 'MEM-0244', secondary: 'Prossy Nabwire', metric: 'UGX 9,450,000', state: 'Active' },
            { primary: 'MEM-0319', secondary: 'Western Dairy Staff', metric: 'UGX 42,100,000', state: 'Corporate' },
          ],
        },
      ],
    },
  },
  {
    slug: 'hr',
    name: 'DayTech HR & Payroll',
    tagline: 'Employee records, attendance tracking, leave approvals, and statutory Ugandan payroll.',
    category: 'People & Payroll',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'An end-to-end human resource and payroll platform built around Uganda and East African statutory schedules—automating PAYE, NSSF, Local Service Tax (LST), leave balances, and downloadable payslips.',
    problemStatement:
      'HR and finance teams spend excessive hours every month recalculating PAYE brackets, NSSF 5%/10% splits, advances, and department leave overlaps across disconnected spreadsheets.',
    proposedSolution:
      'DayTech HR centralises employee contracts, biometric/web attendance logs, multi-level leave approvals, and one-click statutory payroll runs with bank/mobile-money schedule exports.',
    capabilities: [
      'Employee Directory, Contracts & Document Expiry Alerts',
      'Automated PAYE, NSSF & Local Service Tax Calculations',
      'Leave Management & Shift Roster Scheduling',
      'Loans, Salary Advances & Deduction Tracking',
      'Employee Self-Service Payslip Downloads',
      'Department Cost-Centre Payroll Summaries',
    ],
    benefits: [
      'Eliminates manual tax bracket errors on monthly statutory filings',
      'Maintains confidential salary isolation via strict role permissions',
      'Speeds up staff onboarding and annual leave reconciliations',
    ],
    targetCustomers: [
      'SMEs & Multi-Branch Corporates',
      'NGOs & Donor-Funded Organisations',
      'Schools, Hospitals & Hospitality Groups',
    ],
    plans: [
      {
        name: 'Team Essentials',
        audience: 'Up to 35 employees',
        cadence: 'per month (indicative)',
        prices: { UGX: 250000, USD: 70, KES: 9000 },
        limits: ['Up to 35 staff profiles', 'PAYE / NSSF / LST engine', 'Leave & payslip portal'],
      },
      {
        name: 'Organisation Pro',
        audience: 'Up to 200 employees',
        cadence: 'per month (indicative)',
        prices: { UGX: 600000, USD: 165, KES: 21500 },
        limits: ['Up to 200 staff profiles', 'Multi-department approvals', 'Biometric CSV / API sync', 'Custom allowances'],
        highlighted: true,
      },
      {
        name: 'Enterprise Group',
        audience: '200+ staff · multiple entities',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Multi-company payroll entities', 'ERP general ledger connectors', 'Dedicated support SLA'],
      },
    ],
    faqs: [
      {
        question: 'Are statutory PAYE and NSSF rules configurable if legislation updates?',
        answer:
          'Yes. Tax brackets and statutory contribution rates are stored in versioned configuration tables rather than hard-coded.',
      },
      {
        question: 'Can employees view their own payslips securely?',
        answer:
          'Yes. Staff accounts only access their own payslips and leave history, isolated from HR and payroll administration.',
      },
    ],
    relatedSlugs: ['finance', 'crm', 'meet'],
    previewData: {
      moduleTabs: [
        {
          id: 'payroll',
          label: 'Monthly Payroll Run',
          metrics: [
            { label: 'Sample Active Headcount', value: '64', context: 'Illustrative demo entity' },
            { label: 'Sample Gross Payroll', value: 'UGX 98.4M', context: 'Current pay cycle' },
            { label: 'Sample Statutory Compliance', value: 'PAYE + NSSF', context: 'Auto-computed schedules' },
          ],
          columns: ['Department', 'Staff Count', 'Net Payable', 'Approval Status'],
          rows: [
            { primary: 'Engineering & IT', secondary: '18 Full-time', metric: 'UGX 34,200,000', state: 'Verified' },
            { primary: 'Field Operations', secondary: '31 Staff', metric: 'UGX 28,900,000', state: 'Verified' },
            { primary: 'Administration', secondary: '15 Staff', metric: 'UGX 14,650,000', state: 'Pending CFO' },
          ],
        },
        {
          id: 'leave',
          label: 'Leave & Attendance',
          metrics: [
            { label: 'Sample Leave Requests', value: '7', context: 'Awaiting line manager' },
            { label: 'Sample On-Time Check-In', value: '94%', context: 'Demo week average' },
            { label: 'Sample Expiring Contracts', value: '2', context: 'Within 30 days' },
          ],
          columns: ['Staff Member', 'Leave Type', 'Duration', 'State'],
          rows: [
            { primary: 'Brenda Kiconco', secondary: 'Annual Leave', metric: '5 Days', state: 'Approved' },
            { primary: 'Moses Kato', secondary: 'Study Leave', metric: '3 Days', state: 'Pending' },
            { primary: 'Janet Akello', secondary: 'Medical Leave', metric: '2 Days', state: 'Approved' },
          ],
        },
      ],
    },
  },
  {
    slug: 'hotelos',
    name: 'DayTech HotelOS',
    tagline: 'Property management, room reservations, housekeeping status, and POS billing.',
    category: 'Hospitality PMS',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A unified hospitality operating system built for hotels, safari lodges, serviced apartments, and conference venues—connecting front-desk reservations, room folios, restaurant/bar POS, and housekeeping coordination.',
    problemStatement:
      'Properties often run disconnected front-desk notebooks and separate bar/kitchen tills, creating double bookings, unbilled guest room charges, and weak night-audit visibility.',
    proposedSolution:
      'DayTech HotelOS links live room availability calendars, guest check-in/out folios, restaurant order posting to rooms, and daily night-audit revenue reports in one workspace.',
    capabilities: [
      'Visual Room Tape Chart & Reservation Calendar',
      'Guest Check-In, Check-Out & Split Corporate Folios',
      'Restaurant, Bar & Conference Charge-to-Room POS',
      'Housekeeping Readiness & Maintenance Ticket Board',
      'Multi-Currency Folios (UGX, USD, KES) & Tax Breakdowns',
      'Night Audit & Occupancy Yield Reporting',
    ],
    benefits: [
      'Prevents room double-bookings across phone, walk-in, and corporate desks',
      'Stops revenue leakage between restaurant/bar orders and guest folios',
      'Accelerates daily night audit sign-off for general managers',
    ],
    targetCustomers: [
      'Boutique & Business Hotels',
      'Safari Lodges & Eco-Resorts',
      'Conference Centres & Serviced Apartments',
    ],
    plans: [
      {
        name: 'Guesthouse / Lodge',
        audience: 'Up to 25 rooms',
        cadence: 'per month (indicative)',
        prices: { UGX: 300000, USD: 85, KES: 11000 },
        limits: ['Up to 25 rooms', 'Front desk & housekeeping', 'Basic guest invoicing'],
      },
      {
        name: 'Full Property PMS',
        audience: 'Up to 100 rooms + F&B POS',
        cadence: 'per month (indicative)',
        prices: { UGX: 750000, USD: 205, KES: 27000 },
        limits: ['Up to 100 rooms', 'Restaurant/Bar POS sync', 'Night audit & multi-currency', 'Corporate accounts'],
        highlighted: true,
      },
      {
        name: 'Hospitality Group',
        audience: 'Multiple properties · central reservations',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Multi-property group reporting', 'Channel manager API planning', 'Dedicated SLA'],
      },
    ],
    faqs: [
      {
        question: 'Can safari lodges with unreliable internet still run front-desk operations?',
        answer:
          'We design HotelOS deployments with resilient local caching and hybrid branch sync options for remote lodge environments.',
      },
      {
        question: 'Can bar and restaurant bills be posted directly to a guest room?',
        answer:
          'Yes. Kitchen and bar POS orders post cleanly to active guest folios and consolidate at check-out.',
      },
    ],
    relatedSlugs: ['inventory', 'finance', 'hr'],
    previewData: {
      moduleTabs: [
        {
          id: 'frontdesk',
          label: 'Front Desk & Rooms',
          metrics: [
            { label: 'Sample Occupancy', value: '78%', context: 'Demo 40-room property' },
            { label: 'Sample Arrivals Today', value: '11', context: '4 corporate · 7 direct' },
            { label: 'Sample Housekeeping Ready', value: '34 / 40', context: '6 rooms in turnover' },
          ],
          columns: ['Room', 'Guest / Corporate', 'Folio Balance', 'Status'],
          rows: [
            { primary: 'Suite 104', secondary: 'East Africa Advisory', metric: 'UGX 1,450,000', state: 'Checked In' },
            { primary: 'Deluxe 208', secondary: 'David Ochieng', metric: 'UGX 620,000', state: 'Arriving 14:00' },
            { primary: 'Cottage 03', secondary: 'Maintenance Team', metric: 'UGX 0', state: 'Housekeeping' },
          ],
        },
        {
          id: 'pos',
          label: 'F&B Folio Posting',
          metrics: [
            { label: 'Sample Daily Covers', value: '86', context: 'Restaurant + Terrace' },
            { label: 'Sample Posted to Rooms', value: 'UGX 2.9M', context: 'Synced automatically' },
            { label: 'Sample Open Tabs', value: '5', context: 'Active evening service' },
          ],
          columns: ['Ticket ID', 'Outlet', 'Amount', 'Settlement'],
          rows: [
            { primary: 'POS-881', secondary: 'Main Dining · Room 104', metric: 'UGX 285,000', state: 'Posted to Folio' },
            { primary: 'POS-884', secondary: 'Conference Hall A', metric: 'UGX 1,800,000', state: 'Corporate Invoice' },
            { primary: 'POS-889', secondary: 'Poolside Terrace', metric: 'UGX 140,000', state: 'Settled' },
          ],
        },
      ],
    },
  },
  {
    slug: 'farm',
    name: 'DayTech Farm & Agribusiness',
    tagline: 'Crop cycles, livestock records, input inventory, and outgrower yield traceability.',
    category: 'AgriTech Operations',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A practical operations suite for commercial farms, dairy cooperatives, and agribusiness aggregators to record block yields, veterinary/input costs, worker output, and outgrower collections.',
    problemStatement:
      'Agribusinesses often lack block-level cost visibility—making it difficult to verify whether specific crops, herds, or outgrower zones are profitable after fertiliser, feed, and labour expenses.',
    proposedSolution:
      'DayTech Farm tracks production units (plots, paddocks, or farmer cooperatives), input issuances, harvest grading, and seasonal margin analytics.',
    capabilities: [
      'Farm Block, Plot & Livestock Herd Registers',
      'Seed, Feed, Fertiliser & Agro-Chemical Issue Tracking',
      'Harvest Weight, Grading & Post-Harvest Loss Logs',
      'Outgrower Farmer Profiles & Collection Centre Receipts',
      'Veterinary, Vaccination & Agronomic Activity Schedules',
      'Cost-Per-Acre & Seasonal Profitability Reporting',
    ],
    benefits: [
      'Identifies input waste and unrecorded stock shrinkage at farm stores',
      'Builds verifiable produce traceability for institutional and export buyers',
      'Simplifies outgrower collection payouts based on recorded grades',
    ],
    targetCustomers: [
      'Commercial Crop Estates & Mixed Farms',
      'Dairy & Coffee Cooperatives',
      'Agro-Processing & Outgrower Aggregators',
    ],
    plans: [
      {
        name: 'Single Farm Estate',
        audience: '1 estate · up to 5 staff users',
        cadence: 'per month (indicative)',
        prices: { UGX: 280000, USD: 75, KES: 10000 },
        limits: ['Plot & herd registers', 'Input store tracking', 'Harvest & cost reports'],
      },
      {
        name: 'Outgrower Network',
        audience: 'Up to 2,000 registered farmers',
        cadence: 'per month (indicative)',
        prices: { UGX: 700000, USD: 190, KES: 25000 },
        limits: ['Collection centre logs', 'Farmer payout statements', 'Field officer tracking'],
        highlighted: true,
      },
      {
        name: 'Agri-Enterprise',
        audience: 'Multi-region estates & processing plants',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Factory weighbridge integrations', 'Export traceability packs', 'Custom SLA'],
      },
    ],
    faqs: [
      {
        question: 'Can field officers log collections when connectivity is weak?',
        answer:
          'We engineer collection modules with offline-tolerant queuing so weigh-in records sync cleanly once network signal returns.',
      },
      {
        question: 'Does it manage farm store inputs alongside harvest output?',
        answer:
          'Yes. Inputs issued to each block or herd roll directly into seasonal production cost summaries.',
      },
    ],
    relatedSlugs: ['inventory', 'sacco', 'finance'],
    previewData: {
      moduleTabs: [
        {
          id: 'blocks',
          label: 'Plots & Harvest',
          metrics: [
            { label: 'Sample Active Blocks', value: '14', context: 'Illustrative demo estate' },
            { label: 'Sample Season Harvest', value: '42.6 T', context: 'Graded produce intake' },
            { label: 'Sample Input Utilisation', value: '91%', context: 'Against seasonal plan' },
          ],
          columns: ['Block / Zone', 'Commodity', 'Logged Yield', 'Stage'],
          rows: [
            { primary: 'Block B-02 (Kiruhura)', secondary: 'Matooke & Banana', metric: '18.4 Tonnes', state: 'Harvesting' },
            { primary: 'Dairy Unit North', secondary: 'Raw Milk Collection', metric: '1,420 L/day', state: 'Active' },
            { primary: 'Zone C-05 (Kasese)', secondary: 'Arabica Coffee', metric: '6.8 Tonnes', state: 'Curing' },
          ],
        },
        {
          id: 'outgrowers',
          label: 'Outgrower Intake',
          metrics: [
            { label: 'Sample Farmers Active', value: '340', context: 'Demo cooperative' },
            { label: 'Sample Grade A Share', value: '84%', context: 'Quality inspection' },
            { label: 'Sample Pending Payout', value: 'UGX 19.2M', context: 'Scheduled cycle' },
          ],
          columns: ['Collection Centre', 'Deliveries', 'Accepted Weight', 'Batch State'],
          rows: [
            { primary: 'Ibanda Hub 01', secondary: '48 Farmers', metric: '5,240 kg', state: 'Approved' },
            { primary: 'Bushenyi Depot', secondary: '62 Farmers', metric: '7,110 kg', state: 'Graded' },
            { primary: 'Ntoroko Station', secondary: '29 Farmers', metric: '2,890 kg', state: 'Pending Audit' },
          ],
        },
      ],
    },
  },
  {
    slug: 'crm',
    name: 'DayTech CRM',
    tagline: 'Lead capture, deal pipelines, client account records, and follow-up reminders.',
    category: 'Sales & Customer Success',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A structured customer relationship and sales pipeline platform tailored for B2B service providers, distributors, and institutions—turning website enquiries, phone calls, and field visits into tracked proposals and renewals.',
    problemStatement:
      'Growing sales teams lose leads in personal WhatsApp chats and notebooks, leaving management blind to pipeline conversion rates, stalled quotations, and renewal dates.',
    proposedSolution:
      'DayTech CRM captures leads into an organised pipeline, logs interaction history, links quotations to customer organisations, and alerts account managers on overdue follow-ups.',
    capabilities: [
      'Visual Deal Stages & Conversion Tracking',
      'Organisation, Contact & Decision-Maker Registers',
      'Activity Timeline (Calls, Meetings, Quotations Sent)',
      'Follow-Up Task Queues & Renewal Reminders',
      'Territory & Sales Officer Assignment',
      'Pipeline Forecasting & Win/Loss Analysis',
    ],
    benefits: [
      'Prevents inbound enquiries from slipping through unaddressed',
      'Preserves institutional memory when sales personnel change roles',
      'Gives leadership clear visibility into active deal value',
    ],
    targetCustomers: [
      'B2B Service & Consulting Firms',
      'Distributors, Telecom Dealers & Equipment Suppliers',
      'Institutions managing corporate partnerships and renewals',
    ],
    plans: [
      {
        name: 'Sales Desk',
        audience: 'Up to 5 team seats',
        cadence: 'per month (indicative)',
        prices: { UGX: 180000, USD: 50, KES: 6500 },
        limits: ['Up to 5 users', '2,500 contact records', 'Deal pipeline & task reminders'],
      },
      {
        name: 'Commercial Team',
        audience: 'Up to 25 team seats',
        cadence: 'per month (indicative)',
        prices: { UGX: 480000, USD: 130, KES: 17000 },
        limits: ['Up to 25 users', 'Unlimited contacts', 'Web lead webhooks', 'Territory reporting'],
        highlighted: true,
      },
      {
        name: 'Enterprise Suite',
        audience: 'Custom seats & ERP sync',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Custom RBAC hierarchies', 'Finance & invoicing bridge', 'Dedicated onboarding'],
      },
    ],
    faqs: [
      {
        question: 'Can website quotation forms feed directly into DayTech CRM?',
        answer:
          'Yes. Enquiries captured on your web portal can create pipeline leads automatically with source attribution.',
      },
      {
        question: 'Does DayTech CRM support multiple currencies for regional deals?',
        answer:
          'Yes. Opportunities can be logged in UGX, USD, or KES with summary roll-ups.',
      },
    ],
    relatedSlugs: ['finance', 'hr', 'meet'],
    previewData: {
      moduleTabs: [
        {
          id: 'pipeline',
          label: 'Active Pipeline',
          metrics: [
            { label: 'Sample Open Deals', value: '24', context: 'Illustrative demo board' },
            { label: 'Sample Pipeline Value', value: 'UGX 148M', context: 'Active proposals' },
            { label: 'Sample Follow-Ups Due', value: '6', context: 'Scheduled today' },
          ],
          columns: ['Account', 'Opportunity', 'Est. Value', 'Stage'],
          rows: [
            { primary: 'Rwenzori Logistics Ltd', secondary: 'Fleet & ERP Rollout', metric: 'UGX 38,000,000', state: 'Proposal Sent' },
            { primary: 'Nile Valley Clinic', secondary: 'Network & Billing', metric: 'UGX 22,500,000', state: 'Negotiation' },
            { primary: 'Kampala Timber Hub', secondary: 'Inventory Control', metric: 'UGX 14,000,000', state: 'Discovery' },
          ],
        },
        {
          id: 'accounts',
          label: 'Customer Accounts',
          metrics: [
            { label: 'Sample Active Accounts', value: '82', context: 'Verified B2B roster' },
            { label: 'Sample Upcoming Renewals', value: '9', context: 'Next 45 days' },
            { label: 'Sample Average Response', value: '4.2 hrs', context: 'Demo SLA benchmark' },
          ],
          columns: ['Organisation', 'Account Owner', 'Annual Spend', 'Health'],
          rows: [
            { primary: 'Equatorial Supplies', secondary: 'Isaac Ssempijja', metric: 'UGX 18,400,000', state: 'Healthy' },
            { primary: 'Victoria Cold Chain', secondary: 'Rebecca Namono', metric: 'UGX 26,000,000', state: 'Renewal Due' },
            { primary: 'Central Microfinance', secondary: 'Isaac Ssempijja', metric: 'UGX 31,200,000', state: 'Expanding' },
          ],
        },
      ],
    },
  },
  {
    slug: 'inventory',
    name: 'DayTech Inventory & POS',
    tagline: 'Multi-branch stock control, purchase orders, barcode POS, and supplier tracking.',
    category: 'Retail & Supply Chain',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A stock and point-of-sale engine built for wholesalers, pharmacies, hardware stores, and multi-branch retailers—combining purchase orders, inter-branch transfers, expiry/batch alerts, and cashier shift reconciliation.',
    problemStatement:
      'Multi-shop retailers struggle with unrecorded stock transfers, expired items sitting on shelves, cashier variance at shift close, and emergency stockouts of fast-moving goods.',
    proposedSolution:
      'DayTech Inventory tracks every item movement from supplier receipt through warehouse transfer to POS checkout, alerting managers on reorder thresholds and shift variances automatically.',
    capabilities: [
      'Multi-Warehouse & Branch Stock Balances',
      'Fast Barcode Point-of-Sale & Thermal Receipt Printing',
      'Purchase Orders, GRNs & Supplier Payables',
      'Batch Number & Expiry Date Monitoring (FEFO)',
      'Inter-Branch Stock Transfers with Sign-Off Receipts',
      'Daily Cashier Shift Close & Margin Reports',
    ],
    benefits: [
      'Reduces stock shrinkage and unverified inter-branch losses',
      'Prevents expired stock write-offs with early expiry warnings',
      'Gives owners live branch-by-branch gross margin visibility',
    ],
    targetCustomers: [
      'Hardware, Electronics & Wholesale Distributors',
      'Pharmacies, Clinics & Agro-Vet Shops',
      'Supermarkets & Multi-Branch Retail Chains',
    ],
    plans: [
      {
        name: 'Single Outlet POS',
        audience: '1 store · up to 2 tills',
        cadence: 'per month (indicative)',
        prices: { UGX: 160000, USD: 45, KES: 5800 },
        limits: ['1 branch · 2 POS registers', 'Barcode & stock alerts', 'Daily shift summaries'],
      },
      {
        name: 'Multi-Branch Stock',
        audience: 'Up to 5 branches + central warehouse',
        cadence: 'per month (indicative)',
        prices: { UGX: 450000, USD: 125, KES: 16500 },
        limits: ['Up to 5 branches', 'Transfer approvals', 'Batch & expiry tracking', 'Supplier POs'],
        highlighted: true,
      },
      {
        name: 'Wholesale Distribution',
        audience: 'Unlimited depots · field vans',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Van-sales routing support', 'EFRIS / tax integration prep', 'Custom ERP sync'],
      },
    ],
    faqs: [
      {
        question: 'Does it track expiry dates for pharmacies or food distributors?',
        answer:
          'Yes. Batch tracking records expiry dates at goods receipt and highlights near-expiry stock first.',
      },
      {
        question: 'Can head office see stock across all upcountry shops in real time?',
        answer:
          'Yes. Central inventory dashboards consolidate branch quantities, transfers in transit, and daily sales totals.',
      },
    ],
    relatedSlugs: ['finance', 'hotelos', 'farm'],
    previewData: {
      moduleTabs: [
        {
          id: 'stock',
          label: 'Branch Stock Levels',
          metrics: [
            { label: 'Sample Active SKUs', value: '1,240', context: 'Across 3 demo branches' },
            { label: 'Sample Low-Stock Alerts', value: '18', context: 'Below reorder point' },
            { label: 'Sample Stock Valuation', value: 'UGX 286M', context: 'Weighted average cost' },
          ],
          columns: ['SKU / Item', 'Location', 'On Hand', 'Stock Status'],
          rows: [
            { primary: 'UPS-1500VA-PRO', secondary: 'Kampala Main Store', metric: '42 Units', state: 'Optimal' },
            { primary: 'CAT6-BOX-305M', secondary: 'Mbarara Depot', metric: '6 Boxes', state: 'Reorder Soon' },
            { primary: 'THERM-80MM-ROLL', secondary: 'Jinja Branch', metric: '3 Packs', state: 'Low Stock' },
          ],
        },
        {
          id: 'shifts',
          label: 'POS Shift Close',
          metrics: [
            { label: 'Sample Daily Receipts', value: '194', context: 'Demo retail register' },
            { label: 'Sample Cash + MoMo', value: 'UGX 14.8M', context: 'Reconciled tenders' },
            { label: 'Sample Variance', value: 'UGX 0', context: 'Balanced drawer' },
          ],
          columns: ['Register', 'Cashier', 'Expected Total', 'Audit State'],
          rows: [
            { primary: 'Till 01 · Main', secondary: 'Sarah N.', metric: 'UGX 8,420,000', state: 'Balanced' },
            { primary: 'Till 02 · Express', secondary: 'Ivan K.', metric: 'UGX 4,180,000', state: 'Balanced' },
            { primary: 'Mbarara Counter', secondary: 'Lydia M.', metric: 'UGX 2,210,000', state: 'Pending Sign-off' },
          ],
        },
      ],
    },
  },
  {
    slug: 'meet',
    name: 'DayTech Meet & Collaboration',
    tagline: 'Structured video meetings, board pack sharing, action minutes, and attendance logs.',
    category: 'Enterprise Collaboration',
    status: 'Coming Soon',
    externalAppUrl: null,
    overview:
      'A lightweight, bandwidth-conscious virtual meeting and governance workspace designed for distributed institutions, SACCO boards, and remote engineering teams—combining scheduling, agenda packs, attendance registers, and recorded action items.',
    problemStatement:
      'Organisations rely on ad-hoc consumer video links where board documents, attendance sign-off, and post-meeting action accountability remain scattered across emails.',
    proposedSolution:
      'DayTech Meet connects scheduled sessions directly to agenda documents, verifiable attendance logs, and assignable follow-up tasks.',
    capabilities: [
      'Bandwidth-Optimised Audio & Video Rooms',
      'Board Pack & Agenda Document Attachments',
      'Verified Participant Attendance Registers',
      'Action Item Tracking & Resolution Logs',
      'Calendar Timezone Synchronisation (EAT / UTC+3)',
      'Organisation-Scoped Room Access Controls',
    ],
    benefits: [
      'Keeps governance minutes, attendance, and action items in one place',
      'Designed to remain stable on moderate regional broadband links',
      'Protects private board and executive discussions with invite controls',
    ],
    targetCustomers: [
      'Corporate Boards, SACCO Committees & NGOs',
      'Distributed Teams & Training Institutions',
      'Project Delivery & Client Review Teams',
    ],
    plans: [
      {
        name: 'Team Rooms',
        audience: 'Up to 25 participants per room',
        cadence: 'per month (indicative)',
        prices: { UGX: 150000, USD: 40, KES: 5200 },
        limits: ['Agenda & minutes tools', 'Attendance export', 'Up to 25 participants'],
      },
      {
        name: 'Governance & Board',
        audience: 'Up to 100 participants + document vault',
        cadence: 'per month (indicative)',
        prices: { UGX: 380000, USD: 105, KES: 13500 },
        limits: ['Board pack vault', 'Resolution voting logs', 'Up to 100 participants'],
        highlighted: true,
      },
      {
        name: 'Institutional Cloud',
        audience: 'Custom capacity & self-hosted options',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Dedicated media relays', 'SSO / Firebase Auth rules', 'Custom retention policies'],
      },
    ],
    faqs: [
      {
        question: 'When is DayTech Meet scheduled for release?',
        answer:
          'DayTech Meet is currently on our Coming Soon roadmap. You can register early interest via Book a Demo or Request a Quotation.',
      },
      {
        question: 'Will it integrate with Google Calendar when enabled?',
        answer:
          'Yes. Optional Google Calendar synchronisation is built behind explicit OAuth configuration when an organisation enables calendar integration.',
      },
    ],
    relatedSlugs: ['crm', 'hr', 'sacco'],
    previewData: {
      moduleTabs: [
        {
          id: 'sessions',
          label: 'Governance Sessions',
          metrics: [
            { label: 'Sample Scheduled Boards', value: '4', context: 'Upcoming 14 days' },
            { label: 'Sample Action Completion', value: '88%', context: 'Demo committee tracker' },
            { label: 'Sample Average Bitrate', value: '420 kbps', context: 'Low-bandwidth mode' },
          ],
          columns: ['Session', 'Committee', 'Date (EAT)', 'Readiness'],
          rows: [
            { primary: 'Q2 Audit Review', secondary: 'Risk Committee', metric: '2026-05-14 10:00', state: 'Pack Published' },
            { primary: 'Credit Appraisal', secondary: 'Loans Board', metric: '2026-05-18 14:30', state: 'Agenda Open' },
            { primary: 'Sprint Sign-Off', secondary: 'Delivery Team', metric: '2026-05-20 09:00', state: 'Scheduled' },
          ],
        },
        {
          id: 'actions',
          label: 'Action Register',
          metrics: [
            { label: 'Sample Open Actions', value: '12', context: 'Assigned across leads' },
            { label: 'Sample Overdue', value: '1', context: 'Escalated automatically' },
            { label: 'Sample Minutes Signed', value: '100%', context: 'Digital attestation' },
          ],
          columns: ['Action Item', 'Owner', 'Due Date', 'Status'],
          rows: [
            { primary: 'Approve FY Budget V2', secondary: 'Finance Director', metric: '2026-05-15', state: 'In Progress' },
            { primary: 'Publish Backup Drill Log', secondary: 'IT Lead', metric: '2026-05-12', state: 'Completed' },
            { primary: 'Review SLA Addendum', secondary: 'Legal Counsel', metric: '2026-05-19', state: 'Pending' },
          ],
        },
      ],
    },
  },
  {
    slug: 'finance',
    name: 'DayTech Finance & Billing',
    tagline: 'Double-entry accounting, multi-currency invoicing, expense approvals, and cashflow control.',
    category: 'Financial Accounting',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A clean general ledger, accounts receivable/payable, and multi-currency invoicing suite engineered for African businesses that invoice in UGX, USD, or KES and require clear expense approvals and audit-ready financial statements.',
    problemStatement:
      'Businesses often outgrow basic receipt apps yet find heavyweight international ERPs overly complex and poorly adapted to local multi-currency, withholding tax, and mobile-money settlement realities.',
    proposedSolution:
      'DayTech Finance streamlines recurring client invoicing, expense requisition approvals, chart-of-accounts posting, and real-time Profit & Loss or Balance Sheet reporting.',
    capabilities: [
      'Chart of Accounts & Double-Entry General Ledger',
      'Multi-Currency Invoicing & Credit Notes (UGX, USD, KES)',
      'Expense Requisitions & Multi-Stage Approval Controls',
      'Accounts Receivable Ageing & Automated Reminders',
      'Bank & Mobile Money Statement Reconciliation',
      'Trial Balance, P&L, Balance Sheet & Cashflow Exports',
    ],
    benefits: [
      'Enforces pre-payment approval trails on all operational expenses',
      'Eliminates overdue invoice blind spots with live ageing buckets',
      'Connects seamlessly with DayTech Inventory, SACCO, and HR modules',
    ],
    targetCustomers: [
      'Service Agencies, Consultancies & Contractors',
      'Trading Companies & Multi-Branch SMEs',
      'NGOs & Project-Funded Institutions',
    ],
    plans: [
      {
        name: 'SME Accounting',
        audience: '1 legal entity · up to 3 finance users',
        cadence: 'per month (indicative)',
        prices: { UGX: 220000, USD: 60, KES: 8000 },
        limits: ['Invoicing & payables', 'Expense approvals', 'Core financial reports'],
      },
      {
        name: 'Business Pro',
        audience: 'Multi-currency · up to 12 finance users',
        cadence: 'per month (indicative)',
        prices: { UGX: 520000, USD: 140, KES: 18500 },
        limits: ['UGX/USD/KES ledgers', 'Cost centres & budgets', 'Inventory & HR integration'],
        highlighted: true,
      },
      {
        name: 'Consolidated Group',
        audience: 'Multiple subsidiaries · custom audit rules',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Inter-company eliminations', 'Custom ERP connectors', 'Dedicated finance onboarding'],
      },
    ],
    faqs: [
      {
        question: 'Does DayTech Finance automatically collect live Mobile Money payments?',
        answer:
          'Automated Mobile Money and card collection gateways remain disabled by default until you supply and verify your organisation’s merchant credentials.',
      },
      {
        question: 'Can non-finance staff submit expense requests without accessing the general ledger?',
        answer:
          'Yes. Staff can submit requisitions and receipts under scoped permissions while the full ledger remains restricted to authorised finance officers.',
      },
    ],
    relatedSlugs: ['sacco', 'inventory', 'hr'],
    previewData: {
      moduleTabs: [
        {
          id: 'receivables',
          label: 'Invoicing & Receivables',
          metrics: [
            { label: 'Sample Billed (Month)', value: 'UGX 68.5M', context: 'Illustrative demo ledger' },
            { label: 'Sample Collected', value: 'UGX 54.2M', context: '79% settled' },
            { label: 'Sample Overdue >30d', value: 'UGX 4.8M', context: '3 client accounts' },
          ],
          columns: ['Invoice #', 'Client Account', 'Amount', 'Status'],
          rows: [
            { primary: 'INV-DEMO-401', secondary: 'Kigezi Agro Processing', metric: 'UGX 16,400,000', state: 'Paid' },
            { primary: 'INV-DEMO-408', secondary: 'Kampala Meridian Hotel', metric: 'UGX 9,200,000', state: 'Sent' },
            { primary: 'INV-DEMO-392', secondary: 'Lakeside Traders', metric: 'UGX 4,800,000', state: 'Overdue' },
          ],
        },
        {
          id: 'expenses',
          label: 'Expense Approvals',
          metrics: [
            { label: 'Sample Pending Requests', value: '5', context: 'Awaiting sign-off' },
            { label: 'Sample Approved MTD', value: 'UGX 21.4M', context: 'Within budget' },
            { label: 'Sample Budget Variance', value: '-3.2%', context: 'Under monthly cap' },
          ],
          columns: ['Requisition', 'Cost Centre', 'Amount', 'Approval'],
          rows: [
            { primary: 'EXP-114 · Fibre Link', secondary: 'IT Infrastructure', metric: 'UGX 1,850,000', state: 'Approved' },
            { primary: 'EXP-117 · Field Travel', secondary: 'Mbarara Ops', metric: 'UGX 940,000', state: 'Pending' },
            { primary: 'EXP-119 · Server UPS', secondary: 'Cloud & Hardware', metric: 'UGX 3,200,000', state: 'Finance Check' },
          ],
        },
      ],
    },
  },
  {
    slug: 'waterops',
    name: 'DayTech WaterOps',
    tagline: 'Water utility meter billing, pump station telemetry, leakage logs, and field maintenance.',
    category: 'Utilities & Infrastructure',
    status: 'Under Development',
    externalAppUrl: null,
    overview:
      'A specialised utility management platform for municipal water boards, rural water schemes, and private estate utilities—tracking customer meter readings, tiered tariffs, non-revenue water (NRW) alerts, and field technician dispatches.',
    problemStatement:
      'Community and regional water schemes often rely on paper meter books, delayed billing cycles, and unlogged pipe bursts—driving high non-revenue water losses and revenue collection gaps.',
    proposedSolution:
      'DayTech WaterOps streamlines field meter reading capture, automated tiered tariff billing, pump-station production vs. billed consumption reconciliation, and burst-repair work orders.',
    capabilities: [
      'Customer Connection & Meter Asset Registry',
      'Field Meter Reading Capture & Anomaly Flags',
      'Automated Tiered Tariff Billing & Arrears Tracking',
      'Non-Revenue Water (NRW) Zone Reconciliation',
      'Burst Pipe & Disconnection/Reconnection Work Orders',
      'Mobile Money Bill Reference Integration Ready',
    ],
    benefits: [
      'Shortens meter-to-bill turnaround from weeks to hours',
      'Pinpoints distribution zones experiencing high physical or commercial losses',
      'Creates transparent customer billing statements and payment histories',
    ],
    targetCustomers: [
      'Umbrella Water & Sanitation Authorities',
      'District & Town Water Schemes',
      'Industrial Parks & Gated Estate Utilities',
    ],
    plans: [
      {
        name: 'Scheme Starter',
        audience: 'Up to 1,000 metered connections',
        cadence: 'per month (indicative)',
        prices: { UGX: 400000, USD: 110, KES: 14500 },
        limits: ['Up to 1,000 meters', 'Tiered billing engine', 'Field reading app/CSV'],
      },
      {
        name: 'Regional Utility',
        audience: 'Up to 7,500 connections + NRW analytics',
        cadence: 'per month (indicative)',
        prices: { UGX: 950000, USD: 260, KES: 34000 },
        limits: ['Up to 7,500 meters', 'NRW zone balance', 'Technician dispatch board', 'Payment API prep'],
        highlighted: true,
      },
      {
        name: 'Umbrella Authority',
        audience: 'Multiple schemes · custom telemetry',
        cadence: 'tailored deployment',
        prices: { UGX: null, USD: null, KES: null },
        limits: ['Multi-scheme consolidation', 'IoT bulk-meter telemetry', 'Custom audit & SLA'],
      },
    ],
    faqs: [
      {
        question: 'Can WaterOps handle different tariffs for domestic, commercial, and kiosk standpipes?',
        answer:
          'Yes. Tariff matrices support distinct customer categories, standing service fees, and progressive consumption blocks.',
      },
      {
        question: 'Does it support prepaid or smart bulk-meter telemetry?',
        answer:
          'Yes. Consumption data can be imported via standard CSV/API feeds from compatible smart meters and borehole loggers.',
      },
    ],
    relatedSlugs: ['finance', 'crm', 'inventory'],
    previewData: {
      moduleTabs: [
        {
          id: 'billing',
          label: 'Meter Billing Cycle',
          metrics: [
            { label: 'Sample Active Meters', value: '2,180', context: 'Illustrative demo scheme' },
            { label: 'Sample Cycle Billed', value: 'UGX 84.6M', context: 'Tiered tariff run' },
            { label: 'Sample NRW Estimate', value: '17.4%', context: 'Production vs. billed' },
          ],
          columns: ['Zone', 'Meters Read', 'Billed Consumption', 'Cycle Status'],
          rows: [
            { primary: 'Zone A · Central', secondary: '840 Connections', metric: '14,200 m³', state: 'Bills Issued' },
            { primary: 'Zone B · Market', secondary: '620 Connections', metric: '11,850 m³', state: 'Verified' },
            { primary: 'Zone C · Ridge', secondary: '720 Connections', metric: '9,110 m³', state: 'Reading 92%' },
          ],
        },
        {
          id: 'maintenance',
          label: 'Field Work Orders',
          metrics: [
            { label: 'Sample Open Repairs', value: '9', context: 'Active technician queue' },
            { label: 'Sample Avg Resolution', value: '6.5 hrs', context: 'Demo dispatch metric' },
            { label: 'Sample Pump Stations', value: '4 Online', context: 'Pressure normal' },
          ],
          columns: ['Ticket ID', 'Location / Asset', 'Issue Type', 'Priority'],
          rows: [
            { primary: 'WO-302', secondary: 'Main Line · Valve 08', metric: 'Pressure Drop', state: 'Urgent' },
            { primary: 'WO-305', secondary: 'Meter #M-1142', metric: 'Stuck Dial Swap', state: 'Assigned' },
            { primary: 'WO-309', secondary: 'Standpipe 14', metric: 'New Connection', state: 'Scheduled' },
          ],
        },
      ],
    },
  },
];

export function getProductBySlug(slug: string): ProductItem | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
