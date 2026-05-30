import type { DaarKpis } from '@/lib/services/dashboard-daar.service';

const cards: { key: keyof DaarKpis; label: string; color: string }[] = [
  { key: 'total', label: 'Total recibidos', color: 'bg-slate-50 border-slate-200' },
  { key: 'pendientesDocente', label: 'Pendientes docente', color: 'bg-blue-50 border-blue-200' },
  { key: 'enRevision', label: 'En revisión', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'enValidacion', label: 'En validación DAAR', color: 'bg-purple-50 border-purple-200' },
  { key: 'cerrados', label: 'Cerrados', color: 'bg-green-50 border-green-200' },
  { key: 'anulados', label: 'Anulados', color: 'bg-gray-50 border-gray-200' },
];

export function KpiCards({ kpis }: { kpis: DaarKpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ key, label, color }) => (
        <div key={key} className={`rounded-lg border p-4 ${color}`}>
          <p className="text-2xl font-bold text-gray-900">{kpis[key]}</p>
          <p className="text-xs text-gray-600 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
