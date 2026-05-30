import type { PivotFila } from '@/lib/services/dashboard-daar.service';
import { RESULTADO_FINAL_LABELS } from '@/lib/types';

export function PivotTable({ pivot }: { pivot: PivotFila[] }) {
  const cols = [
    { key: 'no_procede' as const, label: RESULTADO_FINAL_LABELS.no_procede },
    { key: 'procede_modifica' as const, label: RESULTADO_FINAL_LABELS.procede_modifica },
    { key: 'procede_sin_modifica' as const, label: RESULTADO_FINAL_LABELS.procede_sin_modifica },
  ];

  return (
    <div className="rounded-lg border border-up-border bg-up-surface overflow-x-auto">
      <table className="min-w-full text-sm divide-y divide-up-border">
        <thead className="bg-up-surface-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Tipo</th>
            {cols.map((c) => (
              <th key={c.key} className="px-4 py-3 text-right font-medium text-up-text-secondary">
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium text-up-text-secondary">Total</th>
            <th className="px-4 py-3 text-right font-medium text-up-text-secondary">% No procede</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-up-border">
          {pivot.map((row) => (
            <tr key={row.tipo}>
              <td className="px-4 py-3 font-medium">{row.tipo}</td>
              {cols.map((c) => (
                <td key={c.key} className="px-4 py-3 text-right tabular-nums">
                  {row[c.key]}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-medium tabular-nums">{row.total}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.pctNoProcede}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
