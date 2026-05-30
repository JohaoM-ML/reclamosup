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
    return <p className="text-gray-500 text-sm">No hay pendientes por docente.</p>;
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="min-w-full text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Docente</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Pendientes</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Plazo próximo</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.docenteId}>
              <td className="px-4 py-3">{r.nombre}</td>
              <td className="px-4 py-3 text-gray-600">{r.email}</td>
              <td className="px-4 py-3 text-right font-medium">{r.pendientes}</td>
              <td className="px-4 py-3">
                {r.plazoProximo
                  ? new Date(r.plazoProximo).toLocaleDateString('es-PE')
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/daar/docente/${r.docenteId}?semestre=${encodeURIComponent(semestre)}`}
                  className="text-indigo-600 hover:underline text-xs"
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
