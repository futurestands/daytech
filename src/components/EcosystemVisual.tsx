import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Cloud, Code2, Cpu, ShieldCheck } from 'lucide-react';

interface EcosystemNode {
  id: string;
  label: string;
  icon: typeof Code2;
  headline: string;
  description: string;
  components: string[];
  route: string;
  routeLabel: string;
}

const NODES: EcosystemNode[] = [
  {
    id: 'software',
    label: 'Software Systems',
    icon: Code2,
    headline: 'Modular Web, Mobile & ERP Applications',
    description:
      'Custom business platforms and DayTech product architectures built for low-bandwidth responsiveness and clean API integration.',
    components: ['Web & Android Apps', 'API Gateways', 'ERP & Cooperative Ledgers'],
    route: '/services/software-development',
    routeLabel: 'Explore Software Development',
  },
  {
    id: 'cloud',
    label: 'Cloud & Network',
    icon: Cloud,
    headline: 'Resilient Hosting & Structured Infrastructure',
    description:
      'Managed cloud environments, database replication, branch VPN tunnels, and disaster recovery designed for operational continuity.',
    components: ['Managed Cloud', 'LAN / WAN & VPN', 'Automated Backups'],
    route: '/services/cloud-hosting',
    routeLabel: 'Explore Cloud & Hosting',
  },
  {
    id: 'ai',
    label: 'AI & Automation',
    icon: Cpu,
    headline: 'Auditable Workflows & Document Intelligence',
    description:
      'Automated document intake, customer triage assistants, and structured workflow triggers with human approval gates.',
    components: ['Document Processing', 'Workflow Triggers', 'Domain Assistants'],
    route: '/services/ai-automation',
    routeLabel: 'Explore AI & Automation',
  },
  {
    id: 'security',
    label: 'Cybersecurity',
    icon: ShieldCheck,
    headline: 'Role-Based Access & Data Protection',
    description:
      'End-to-end access governance, endpoint protection, network segmentation, and audit trails aligned with Uganda’s Data Protection Act.',
    components: ['RBAC & Audit Logs', 'Endpoint Hardening', 'Security Assessments'],
    route: '/services/cybersecurity',
    routeLabel: 'Explore Cybersecurity',
  },
  {
    id: 'analytics',
    label: 'Business Analytics',
    icon: BarChart3,
    headline: 'Unified Operational & Financial Visibility',
    description:
      'Consolidate branch sales, stock movement, loan performance, and departmental budgets into clear executive views.',
    components: ['Executive Dashboards', 'Budget Variance', 'Exportable Audits'],
    route: '/products',
    routeLabel: 'Browse Product Ecosystem',
  },
];

export function EcosystemVisual() {
  const [activeId, setActiveId] = useState<string>('software');
  const activeNode = NODES.find((n) => n.id === activeId) || NODES[0];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-[#2563EB] dark:text-[#06B6D4]">
            Connected Digital Architecture
          </p>
          <p className="text-sm font-semibold text-[#0B1120] dark:text-white mt-0.5">
            Select a capability layer to inspect how DayTech connects systems
          </p>
        </div>
      </div>

      {/* Interactive Layer Selector Tabs */}
      <div
        className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4"
        role="tablist"
        aria-label="DayTech Architecture Layers"
      >
        {NODES.map((node) => {
          const Icon = node.icon;
          const isActive = node.id === activeId;
          return (
            <button
              key={node.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(node.id)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{node.label}</span>
            </button>
          );
        })}
      </div>

      {/* Connected Node Detail Viewport */}
      <div className="mt-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#020617]/70 p-5">
          <div key={activeNode.id} className="ecosystem-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-[#0B1120] dark:text-white">
                {activeNode.headline}
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Architecture Layer · {activeNode.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeNode.description}
            </p>

            {/* Connected Module Nodes */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeNode.components.map((comp, idx) => (
                <div
                  key={comp}
                  className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800"
                >
                  <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    0{idx + 1}. Module
                  </span>
                  <span className="block text-sm font-medium text-[#0B1120] dark:text-slate-100 mt-0.5">
                    {comp}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Engineered for Uganda, East Africa &amp; international standards
              </span>
              <Link
                to={activeNode.route}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
              >
                <span>{activeNode.routeLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}
