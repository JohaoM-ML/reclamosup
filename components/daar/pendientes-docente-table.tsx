import Link from 'next/link';
import type { PendienteDocente } from '@/lib/services/dashboard-daar.service';

export function PendientesDocenteTable({
  rows,
  semestre = '2026-I',
}: {
  rows: PendienteDocente[];
  semestre?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-up-text-muted text-sm">No hay pendientes por docente.</p>;
  }

  return (
    <div className="rounded-lg border border-up-border bg-up-surface overflow-hidden">
      <table className="min-w-full text-sm divide-y divide-up-border">
        <thead className="bg-up-surface-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Cód. docente</th>
            <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Docente</th>
            <th className="px-4 py-3 text-right font-medium text-up-text-secondary">Pendientes</th>
            <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Plazo próximo</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-up-border">
          {rows.map((r) => (
            <tr key={r.docenteId}>
              <td className="px-4 py-3 font-mono text-xs">{r.codigo}</td>
              <td className="px-4 py-3">{r.nombre}</td>
              <td className="px-4 py-3 text-right font-medium">{r.pendientes}</td>
              <td className="px-4 py-3">
                {r.plazoProximo
                  ? new Date(r.plazoProximo).toLocaleDateString('es-PE')
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/daar/docente/${r.docenteId}?semestre=${encodeURIComponent(semestre)}`}
                  className="text-up-blue hover:underline text-xs"
                >
                  Ver bandeja
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
