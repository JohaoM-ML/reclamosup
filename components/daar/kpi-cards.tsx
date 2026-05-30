import type { DaarKpis } from '@/lib/services/dashboard-daar.service';

const cards: { key: keyof DaarKpis; label: string; color: string }[] = [
  { key: 'total', label: 'Total recibidos', color: 'bg-up-surface border-up-border' },
  { key: 'pendientesDocente', label: 'Pendientes docente', color: 'bg-up-blue/5 border-up-blue/20' },
  { key: 'enRevision', label: 'En revisión', color: 'bg-amber-50 border-amber-200' },
  { key: 'enValidacion', label: 'En validación DAAR', color: 'bg-violet-50 border-violet-200' },
  { key: 'cerrados', label: 'Cerrados', color: 'bg-emerald-50 border-emerald-200' },
  { key: 'anulados', label: 'Anulados', color: 'bg-up-surface-muted border-up-border' },
];

export function KpiCards({ kpis }: { kpis: DaarKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ key, label, color }) => (
        <div key={key} className={`rounded-lg border p-4 shadow-sm ${color}`}>
          <p className="text-2xl font-bold text-up-navy">{kpis[key]}</p>
          <p className="mt-1 text-xs font-medium text-up-text-secondary">{label}</p>
        </div>
      ))}
    </div>
  );
}
