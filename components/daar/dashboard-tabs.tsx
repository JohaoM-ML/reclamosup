'use client';

const TABS = [
  { id: 'operativo', label: 'Operativo' },
  { id: 'tiempos', label: 'Tiempos' },
  { id: 'volumen', label: 'Volumen' },
  { id: 'calidad', label: 'Calidad' },
  { id: 'cumplimiento', label: 'Cumplimiento' },
  { id: 'eficiencia', label: 'Eficiencia' },
] as const;

export type DashboardTabId = (typeof TABS)[number]['id'];

type Props = {
  active: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
};

export function DashboardTabs({ active, onChange }: Props) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-up-border pb-px">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-t-md px-4 py-2.5 text-sm font-semibold transition-colors ${
            active === tab.id
              ? '-mb-px border border-b-0 border-up-border bg-up-blue text-white'
              : 'text-up-text-secondary hover:bg-up-surface-muted hover:text-up-navy'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
