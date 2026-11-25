import { ServiceItem } from '../types/domain';

export const SERVICES: ServiceItem[] = [
  {
    slug: 'software-development',
    number: '01',
    title: 'Software Development & Systems Engineering',
    shortTitle: 'Software Engineering',
    summary:
      'Custom web applications, enterprise ERPs, mobile apps, USSD/Mobile Money APIs, and scalable multi-branch backend systems.',
    overview:
      'DayTech Solutions engineers tailored software platforms built around real institutional workflows—from cooperative finance ledgers and school management systems to logistics dispatch and multi-branch enterprise resource planning.',
    iconName: 'Code2',
    features: [
      'Custom Web & Enterprise Applications (TypeScript, React, Next.js, Node.js)',
      'Cross-Platform Mobile Applications (Android & iOS)',
      'MTN MoMo & Airtel Money API Integration',
      'Multi-Branch Ledger & Inventory Systems',
      'REST & GraphQL API Design and Legacy System Modernisation',
      'Automated Testing, CI/CD Pipelines & Technical Documentation',
    ],
    benefits: [
      'Eliminates manual spreadsheet reconciliation across departments and branches',
      'Enforces role-based permissions and verifiable audit trails',
      'Engineered to tolerate intermittent East African connectivity cleanly',
    ],
    targetCustomers: [
      'SACCOs, Microfinance Institutions & Credit Unions',
      'Medium & Large Enterprises needing tailored ERP workflows',
      'Schools, Universities, Clinics & NGOs',
    ],
    implementationApproach: [
      {
        step: 'Workflow Discovery & Data Modelling',
        detail: 'Map operational processes, user roles, reporting needs, and statutory compliance rules.',
      },
      {
        step: 'Architecture & Interactive Prototyping',
        detail: 'Validate user interfaces, API contracts, and database schemas before full implementation.',
      },
      {
        step: 'Iterative Build & Security Testing',
        detail: 'Deliver tested modules in transparent milestones with strict input validation and access controls.',
      },
      {
        step: 'Training, Migration & Handover',
        detail: 'Migrate historical records, train staff, and establish long-term maintenance SLAs.',
      },
    ],
    faqs: [
      {
        question: 'Do we retain ownership of custom-built software and data?',
        answer:
          'Yes. For bespoke software development engagements, intellectual property ownership and database control terms are defined clearly in your Master Services Agreement.',
      },
      {
        question: 'Can DayTech integrate with existing accounting or Mobile Money providers?',
        answer:
          'Yes. We design clean REST and webhook integrations for MTN Mobile Money, Airtel Money, banking APIs, and third-party ERP connectors when merchant credentials are supplied.',
      },
    ],
  },
  {
    slug: 'it-infrastructure',
    number: '02',
    title: 'IT Infrastructure & Networking',
    shortTitle: 'IT Infrastructure',
    summary:
      'Structured LAN cabling, enterprise Wi-Fi, server room setup, branch VPNs, VoIP telephony, and CCTV/access control systems.',
    overview:
      'Reliable software requires resilient physical infrastructure. We design, install, and document enterprise networks, server racks, power redundancy, and multi-site VPN connectivity for offices, campuses, hotels, and industrial sites.',
    iconName: 'Network',
    features: [
      'Structured Cat6/Cat6A & Fibre Optic Cabling',
      'Managed Enterprise Wi-Fi & Guest Captive Portals',
      'Server Rack Assembly, UPS & Hybrid Power Planning',
      'Multi-Branch Site-to-Site VPN & SD-WAN Routing',
      'IP Telephony (VoIP) & Conference Room Systems',
      'CCTV Surveillance & Biometric Access Control Integration',
    ],
    benefits: [
      'Minimises branch downtime with segmented VLANs and dual-WAN failover',
      'Provides clean, labelled cabling and up-to-date network topology documentation',
      'Separates corporate, operational, and guest traffic for stronger security',
    ],
    targetCustomers: [
      'Corporate Offices & Multi-Branch Institutions',
      'Hotels, Lodges, Hospitals & Campuses',
      'Manufacturing Plants & Logistics Warehouses',
    ],
    implementationApproach: [
      {
        step: 'Site Survey & RF Mapping',
        detail: 'Assess physical layout, cable pathways, interference zones, and power backup capacity.',
      },
      {
        step: 'Bill of Materials & Topology Design',
        detail: 'Specify enterprise switches, firewalls, access points, and VLAN addressing plans.',
      },
      {
        step: 'Installation, Termination & Testing',
        detail: 'Execute structured installation with port labelling, signal testing, and firewall hardening.',
      },
      {
        step: 'Documentation & Handover',
        detail: 'Deliver network diagrams, credential vaults, and staff orientation.',
      },
    ],
    faqs: [
      {
        question: 'Do you support offices outside Kampala?',
        answer:
          'Yes. Our engineering teams deploy across Uganda (including Mbarara, Western, Central, Eastern, and Northern regions) as well as regional East African sites.',
      },
      {
        question: 'Can you audit and clean up an existing unstable office network?',
        answer:
          'Yes. We perform structured network remediation—re-terminating messy racks, segmenting flat networks into VLANs, and configuring firewall failover.',
      },
    ],
  },
  {
    slug: 'ai-automation',
    number: '03',
    title: 'Artificial Intelligence & Business Automation',
    shortTitle: 'AI & Automation',
    summary:
      'Practical workflow automation, document extraction, internal knowledge search, and executive decision-support analytics.',
    overview:
      'We build grounded, cost-controlled automation and AI workflows that eliminate repetitive administrative tasks—connecting email, spreadsheets, CRM pipelines, and internal knowledge bases without risky hype or unverified claims.',
    iconName: 'Cpu',
    features: [
      'Approval Workflows & Automated Operational Alerts',
      'Invoice, Receipt & Document Data Extraction Pipelines',
      'Internal Policy & SOP Knowledge Search Assistants',
      'Automated Reporting & Executive KPI Digests',
      'Customer Support Triage & Ticket Routing',
      'Strict Privacy Guardrails & Human-in-the-Loop Controls',
    ],
    benefits: [
      'Reduces repetitive manual data entry and cross-system copy-pasting',
      'Keeps human approvals in control of sensitive financial or customer actions',
      'Enforces predictable API token budgets and strict data boundaries',
    ],
    targetCustomers: [
      'Operations & Finance Teams managing high document volumes',
      'Customer Support Desks & Service Organisations',
      'Growing Enterprises seeking automated cross-app reporting',
    ],
    implementationApproach: [
      {
        step: 'Bottleneck Audit',
        detail: 'Identify high-volume manual processes where automation creates measurable time savings.',
      },
      {
        step: 'Guardrail & Privacy Design',
        detail: 'Define data minimisation rules, audit logs, and deterministic fallback behaviour.',
      },
      {
        step: 'Pipeline Integration',
        detail: 'Connect internal databases, email/ticketing systems, and structured AI/workflow connectors.',
      },
      {
        step: 'Accuracy Evaluation',
        detail: 'Validate outputs against real sample cases before production rollout.',
      },
    ],
    faqs: [
      {
        question: 'Are AI models trained on our private business data?',
        answer:
          'No. We configure zero-retention API boundaries and retrieval-grounded architectures so your confidential records remain isolated within your database.',
      },
      {
        question: 'Do we need AI features for basic workflow automation?',
        answer:
          'Not always. Many operational bottlenecks are solved cleanly with deterministic scheduled jobs, webhooks, and validation pipelines without incurring LLM costs.',
      },
    ],
  },
  {
    slug: 'cloud-hosting',
    number: '04',
    title: 'Cloud Computing, DevOps & Managed Hosting',
    shortTitle: 'Cloud & Hosting',
    summary:
      'Cloud architecture, automated off-site backups, containerisation, domain/DNS management, and disaster recovery planning.',
    overview:
      'DayTech helps institutions migrate away from fragile single-server setups to dependable cloud infrastructure—with automated daily backups, SSL/TLS enforcement, uptime monitoring, and predictable monthly resource sizing.',
    iconName: 'Cloud',
    features: [
      'Cloud Migration & Hybrid On-Premise Integration',
      'Managed PostgreSQL, Firestore & Database Backup Policies',
      'Domain Registration, DNSSEC & Business Email Setup',
      'Containerised Deployments & Zero-Downtime Releases',
      'Automated Off-Site Snapshots & Disaster Recovery Drills',
      'Uptime Monitoring, Log Aggregation & Cost Optimisation',
    ],
    benefits: [
      'Protects critical business data against hardware theft, fire, or drive failure',
      'Eliminates surprise cloud bills through right-sized resource budgets',
      'Standardises deployment pipelines so updates ship safely',
    ],
    targetCustomers: [
      'Organisations moving off local office servers or shared cPanel hosting',
      'SaaS & Fintech Startups needing reliable cloud foundations',
      'Institutions requiring verifiable backup restoration tests',
    ],
    implementationApproach: [
      {
        step: 'Workload & Cost Assessment',
        detail: 'Review storage volume, traffic patterns, compliance residency, and monthly budget targets.',
      },
      {
        step: 'Infrastructure-as-Code Provisioning',
        detail: 'Configure production and staging environments with automated TLS and firewall rules.',
      },
      {
        step: 'Migration & Backup Verification',
        detail: 'Transfer data safely and execute a documented test restore before cutover.',
      },
      {
        step: 'Ongoing Monitoring',
        detail: 'Track health checks, SSL renewals, and backup integrity continuously.',
      },
    ],
    faqs: [
      {
        question: 'Can we keep sensitive databases on-premise while using cloud backups?',
        answer:
          'Yes. We regularly design hybrid architectures where local branch servers sync encrypted backups and summary telemetry to cloud storage.',
      },
      {
        question: 'Who owns the cloud and domain accounts?',
        answer:
          'You do. We provision cloud projects and domain registrars under your organisation’s legal ownership and grant engineering access cleanly.',
      },
    ],
  },
  {
    slug: 'web-digital',
    number: '05',
    title: 'Web Platforms & Digital Experience Design',
    shortTitle: 'Web & Digital',
    summary:
      'High-performance corporate portals, self-service customer hubs, accessible UX systems, and technical SEO foundations.',
    overview:
      'Your digital headquarters should inspire immediate credibility and convert visitors into qualified leads. We design and build fast, accessible web platforms tailored for East African mobile bandwidth as well as international stakeholders.',
    iconName: 'Globe',
    features: [
      'Corporate Headquarters & Institutional Web Portals',
      'Customer Self-Service & Booking Portals',
      'Accessible Light & Dark Mode Design Systems',
      'Technical SEO, OpenGraph & Structured Data Architecture',
      'Lightweight Assets Optimised for Mobile Bandwidth',
      'CMS & Lead Capture Integration with CRM Pipelines',
    ],
    benefits: [
      'Fast page loads even over 3G/4G regional mobile networks',
      'Clear information architecture that guides users to enquiries and demos',
      'Compliant privacy notices, cookie transparency, and clean semantic HTML',
    ],
    targetCustomers: [
      'Corporates, NGOs & Government Agencies modernising web presence',
      'Hotels, Universities & Healthcare Providers needing online booking/portals',
      'B2B Technology & Service Providers',
    ],
    implementationApproach: [
      {
        step: 'Information Architecture & Content Audit',
        detail: 'Structure navigation, conversion journeys, and verified institutional copy.',
      },
      {
        step: 'UI System & Responsive Prototyping',
        detail: 'Design clean typography, contrast-checked themes, and mobile layouts.',
      },
      {
        step: 'Engineering & SEO Implementation',
        detail: 'Build modular React/Next.js frontends with sitemap, metadata, and form persistence.',
      },
      {
        step: 'Launch & Analytics Handover',
        detail: 'Verify Lighthouse performance, accessibility checks, and staff editing workflows.',
      },
    ],
    faqs: [
      {
        question: 'Will our team be able to update website content without coding?',
        answer:
          'Yes. Dynamic sections can be connected to a structured administrative dashboard with role-based publishing controls.',
      },
      {
        question: 'Do you ensure websites work smoothly on mobile phones?',
        answer:
          'Yes. Every interface is engineered mobile-first and tested across narrow phone viewports, tablets, and wide desktop screens.',
      },
    ],
  },
  {
    slug: 'cybersecurity',
    number: '06',
    title: 'Cybersecurity, Data Protection & Compliance',
    shortTitle: 'Cybersecurity',
    summary:
      'Security audits, firewall hardening, RBAC reviews, endpoint protection, and Uganda Data Protection Act alignment.',
    overview:
      'Digital growth introduces operational risk. DayTech helps organisations identify vulnerabilities across web applications, office networks, and staff workflows—aligning technical controls with the Uganda Data Protection and Privacy Act.',
    iconName: 'ShieldCheck',
    features: [
      'Web Application & API Security Assessments',
      'Firewall, Router & Wi-Fi Hardening',
      'Identity, Multi-Factor Auth & RBAC Architecture Reviews',
      'Uganda Data Protection & Privacy Act Readiness Support',
      'Endpoint Security & Patch Management Policies',
      'Incident Response Runbooks & Staff Security Awareness',
    ],
    benefits: [
      'Reduces exposure to ransomware, credential theft, and unauthorised data leaks',
      'Protects customer PII with least-privilege access boundaries and encryption',
      'Provides actionable, prioritised remediation steps rather than generic checklists',
    ],
    targetCustomers: [
      'SACCOs, Financial Institutions & Payment-Adjacent Businesses',
      'Healthcare Clinics & Educational Institutions handling sensitive records',
      'Enterprises preparing for vendor or regulatory security reviews',
    ],
    implementationApproach: [
      {
        step: 'Attack Surface & Access Audit',
        detail: 'Review public endpoints, authentication flows, server ports, and user privilege maps.',
      },
      {
        step: 'Prioritised Findings Brief',
        detail: 'Deliver clear risk-ranked remediation recommendations with concrete technical fixes.',
      },
      {
        step: 'Hardening & Verification',
        detail: 'Apply firewall policies, security rules, MFA enforcement, and logging alerts.',
      },
      {
        step: 'Continuous Review Cadence',
        detail: 'Establish periodic credential rotation and backup verification schedules.',
      },
    ],
    faqs: [
      {
        question: 'Can you review security rules and access controls on an existing app?',
        answer:
          'Yes. We regularly audit Firestore rules, SQL permissions, JWT/session handling, and backend API authorisation checks.',
      },
      {
        question: 'Do you assist with data protection consent and privacy documentation?',
        answer:
          'We align technical data flows, retention limits, and consent workflows with regulatory standards alongside your legal counsel.',
      },
    ],
  },
  {
    slug: 'it-consultancy',
    number: '07',
    title: 'IT Consultancy & Digital Transformation Advisory',
    shortTitle: 'IT Consultancy',
    summary:
      'ICT strategy, vendor evaluation, systems architecture blueprints, procurement advisory, and digital roadmapping.',
    overview:
      'Technology investments fail when tools are purchased before operational workflows are understood. DayTech advises executive leadership, boards, and NGO programme teams on selecting practical architectures, evaluating vendors, and phasing transformation budgets.',
    iconName: 'Compass',
    features: [
      'Institutional Digital Transformation Roadmaps',
      'Software & Hardware Procurement Specifications (RFPs/TORs)',
      'Vendor Neutral Architecture & Build-vs-Buy Reviews',
      'ICT Policy & Governance Framework Drafting',
      'Technical Due Diligence & System Integration Planning',
      'Fractional Technical Leadership & Project Oversight',
    ],
    benefits: [
      'Prevents costly vendor lock-in and oversized software licenses',
      'Aligns IT capital expenditure with measurable operational milestones',
      'Equips non-technical leadership with clear budget and risk visibility',
    ],
    targetCustomers: [
      'Executive Teams & Boards planning multi-year digitisation',
      'NGOs & Donor Programmes drafting technical Terms of Reference',
      'Growing SMEs transitioning from manual operations to integrated systems',
    ],
    implementationApproach: [
      {
        step: 'Stakeholder Interviews',
        detail: 'Engage leadership, department heads, and frontline staff to uncover real constraints.',
      },
      {
        step: 'Current-State Gap Analysis',
        detail: 'Evaluate existing tools, licensing costs, data silos, and infrastructure bottlenecks.',
      },
      {
        step: 'Phased Transformation Blueprint',
        detail: 'Produce a sequenced 6-to-24 month implementation plan with clear ROI checkpoints.',
      },
      {
        step: 'Advisory Retainer (Optional)',
        detail: 'Support vendor selection, contract review, and delivery quality assurance.',
      },
    ],
    faqs: [
      {
        question: 'Can DayTech help us write Terms of Reference before hiring vendors?',
        answer:
          'Yes. We prepare vendor-neutral technical specifications and evaluation scorecards so you receive comparable, transparent proposals.',
      },
      {
        question: 'How long does an initial digital readiness assessment take?',
        answer:
          'Focused assessments for single-site organisations typically complete within 2 to 3 weeks, including executive readout.',
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceItem | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
