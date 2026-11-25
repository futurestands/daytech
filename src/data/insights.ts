import { InsightArticle, ReferenceArchitecture } from '../types/domain';

export const INSIGHTS: InsightArticle[] = [
  {
    slug: 'sacco-core-ledger-controls-uganda',
    title: 'Designing Audit-Ready Core Ledgers for Growing SACCOs in Uganda',
    category: 'FinTech & Cooperatives',
    publishedLabel: 'Technical Brief',
    readTime: '5 min read',
    summary:
      'Why maker-checker approvals, immutable transaction journals, and automated backup verification matter far more than surface UI polish in cooperative finance software.',
    sections: [
      {
        heading: 'Why Spreadsheets Fail Above 250 Members',
        body: 'Manual spreadsheets lack row-level concurrency, enforceable maker-checker approval boundaries, and immutable edit history. Once loan schedules and guarantor exposures expand, silent formula drift becomes an operational and governance risk.',
      },
      {
        heading: 'Core Engineering Controls Required',
        body: 'Every SACCO platform should enforce double-entry journal balancing, server-verified timestamps, separation between data entry and loan disbursement sign-off, and automated daily encrypted off-site snapshots.',
      },
      {
        heading: 'Phased Integration with Mobile Money',
        body: 'Rather than rushing live collection hooks prematurely, cooperatives should first stabilise member KYC, account reference formats, and reconciliation rules before activating MTN or Airtel API webhooks.',
      },
    ],
  },
  {
    slug: 'uganda-data-protection-practical-checklist',
    title: 'Practical Engineering Alignment with the Uganda Data Protection and Privacy Act',
    category: 'Cybersecurity & Compliance',
    publishedLabel: 'Governance Note',
    readTime: '6 min read',
    summary:
      'Translating statutory data protection principles into concrete database rules, PII subcollection isolation, consent records, and least-privilege role boundaries.',
    sections: [
      {
        heading: 'Data Minimisation & Explicit Purpose Consent',
        body: 'Collect only the fields strictly required to deliver the requested service or quotation, and persist explicit timestamped consent alongside every public enquiry.',
      },
      {
        heading: 'Separating Public Profiles from Sensitive PII',
        body: 'In multi-user web platforms, email addresses, phone numbers, and identity numbers should never be broadly queryable by unauthenticated clients or peer users. Isolated private subcollections and strict security rules protect personal data even if client queries are inspected.',
      },
      {
        heading: 'Preventing Client-Side Privilege Escalation',
        body: 'Role assignments must always be validated server-side or in database security rules so public registration flows can never grant administrative or staff privileges.',
      },
    ],
  },
  {
    slug: 'resilient-network-and-cloud-hybrid-design',
    title: 'Designing Hybrid Branch Networks for Variable East African Connectivity',
    category: 'IT Infrastructure & Cloud',
    publishedLabel: 'Architecture Note',
    readTime: '4 min read',
    summary:
      'Practical patterns for dual-WAN failover, VLAN segmentation, power backup sizing, and lightweight web payloads for regional branches.',
    sections: [
      {
        heading: 'Segment Corporate, Operational, and Guest Traffic',
        body: 'A flat office network allows any guest phone or compromised workstation to scan point-of-sale servers or printers. Clean VLAN segmentation and firewall policies isolate operational assets immediately.',
      },
      {
        heading: 'Dual-WAN Failover & Power Autonomy',
        body: 'Pairing primary fibre links with automated LTE/4G failover and right-sized UPS protection prevents mid-shift POS disruptions and database corruption.',
      },
      {
        heading: 'Optimising Web Interfaces for 3G/4G Mobile Users',
        body: 'Avoid oversized assets and blocking scripts. Clean typography, compressed imagery, and modular bundling keep self-service portals responsive across upcountry connections.',
      },
    ],
  },
];

export const REFERENCE_ARCHITECTURES: ReferenceArchitecture[] = [
  {
    id: 'arch-multi-branch-erp',
    title: 'Multi-Branch Cooperative & Retail Operations Architecture',
    domain: 'FinTech & Multi-Site Inventory',
    summary:
      'Blueprint for organisations operating regional branches with centralised role-based oversight, maker-checker financial workflows, and resilient cloud data synchronisation.',
    stack: ['TypeScript', 'React', 'Node.js / Zod', 'Cloud Firestore', 'RBAC Rules'],
    outcomes: [
      'Centralised general ledger and branch-level stock isolation',
      'Strict server/rules validation on every financial state transition',
      'Immutable audit logs tracking administrative approvals',
    ],
  },
  {
    id: 'arch-campus-hospitality-net',
    title: 'Segmented Enterprise Campus & Hospitality Network Blueprint',
    domain: 'IT Infrastructure & Security',
    summary:
      'Structured Layer-2/Layer-3 network design separating back-office ERP, VoIP, CCTV, and guest Wi-Fi portals behind dual-WAN failover firewalls.',
    stack: ['VLAN Segmentation', 'Dual-WAN Failover', 'Cat6A / Fibre', 'Site-to-Site VPN', 'UPS Redundancy'],
    outcomes: [
      'Isolated corporate POS and accounting traffic from public guest Wi-Fi',
      'Zero single-point connectivity failure during primary ISP maintenance',
      'Documented rack schematics and credential governance',
    ],
  },
  {
    id: 'arch-privacy-first-portal',
    title: 'Privacy-First Self-Service Client & Administrative Workspace',
    domain: 'Web Platforms & Governance',
    summary:
      'Reference web portal separating public company content, verified reference lookups, client-scoped workspaces, and protected administrative operations.',
    stack: ['React + Vite', 'Firebase Auth', 'Security Rules', 'Express API', 'SEO Sitemap'],
    outcomes: [
      'Public site operates cleanly without mandatory login barriers',
      'Zero client-side secret exposure; strict backend/rules admin verification',
      'Private portals excluded from search indexing via noindex and robots.txt',
    ],
  },
];
