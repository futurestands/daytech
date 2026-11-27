import { Boxes, Cable, Layers3, ShieldCheck } from 'lucide-react';

const systems = {
  platform: { label: 'Connected technology', layers: ['Business applications', 'Secure infrastructure', 'Data and automation'] },
  engineering: { label: 'Engineering delivery', layers: ['Discovery', 'Implementation', 'Operational support'] },
  infrastructure: { label: 'Reliable infrastructure', layers: ['Network and compute', 'Identity and access', 'Monitoring and continuity'] },
};

export function ArchitectureIllustration({ variant }: { variant: keyof typeof systems }) {
  const { label, layers } = systems[variant];
  const icons = [Boxes, ShieldCheck, Cable];
  return (
    <div className="flex h-full min-h-64 flex-col justify-center rounded-xl bg-[#111f33] px-5 py-8 text-white sm:px-9">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center gap-3 border-b border-slate-500 pb-4 text-sm font-semibold text-[#a5f3fc]">
          <Layers3 size={23} aria-hidden="true" />{label}
        </div>
        <ul className="mt-4 grid gap-2">
          {layers.map((layer, index) => {
            const Icon = icons[index];
            return <li key={layer} className="flex items-center gap-3 rounded-lg border border-slate-600 bg-[#172d47] px-4 py-3 text-sm">
              <Icon size={18} className="shrink-0 text-[#71e6ef]" aria-hidden="true" />{layer}
            </li>;
          })}
        </ul>
      </div>
    </div>
  );
}
