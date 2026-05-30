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
    <nav className="flex flex-wrap gap-1 border-b border-gray-200 pb-px">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            active === tab.id
              ? 'bg-white border border-b-white border-gray-200 text-indigo-700 -mb-px'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
