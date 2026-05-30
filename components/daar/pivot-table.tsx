import type { PivotFila } from '@/lib/services/dashboard-daar.service';
import { RESULTADO_FINAL_LABELS } from '@/lib/types';

export function PivotTable({ pivot }: { pivot: PivotFila[] }) {
  const cols = [
    { key: 'no_procede' as const, label: RESULTADO_FINAL_LABELS.no_procede },
    { key: 'procede_modifica' as const, label: RESULTADO_FINAL_LABELS.procede_modifica },
    { key: 'procede_sin_modifica' as const, label: RESULTADO_FINAL_LABELS.procede_sin_modifica },
  ];

  return (
    <div className="bg-white rounded-lg border overflow-x-auto">
      <table className="min-w-full text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
            {cols.map((c) => (
              <th key={c.key} className="px-4 py-3 text-right font-medium text-gray-600">
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">% No procede</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
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
