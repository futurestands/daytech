import type { ReactNode } from 'react';

export function WorkspaceSectionButton({ active, label, children, onSelect }: {
  active: boolean; label: string; children: ReactNode; onSelect: () => void;
}) {
  return (
    <button type="button" aria-label={label} aria-current={active ? 'page' : undefined} title={label}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        active ? 'border-transparent bg-[#2563EB] text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#020617] dark:text-slate-300 dark:hover:bg-slate-900'
      }`}>
      {children}
      <span className="admin-navigation-label">{label}</span>
    </button>
  );
}

export function WorkspaceNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div role={error ? 'alert' : 'status'} className={`rounded-lg border p-3.5 text-sm ${
      error ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
        : 'border-blue-200 bg-blue-50 text-slate-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
    }`}>{children}</div>
  );
}
