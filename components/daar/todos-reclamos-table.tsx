'use client';

import Link from 'next/link';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { exportReclamosToExcel } from '@/lib/export-reclamos-excel';
import type { getTodosReclamos } from '@/lib/services/reclamo.service';
import type { EstadoReclamo } from '@/lib/types';

type Props = {
  reclamos: Awaited<ReturnType<typeof getTodosReclamos>>;
};

export function TodosReclamosTable({ reclamos }: Props) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-up-text">
          Todos los reclamos ({reclamos.length})
        </h2>
        <button
          type="button"
          onClick={() => exportReclamosToExcel(reclamos)}
          disabled={reclamos.length === 0}
          className="rounded-md border border-up-border bg-up-surface px-3 py-1.5 text-sm font-medium text-up-text hover:bg-up-surface-muted disabled:opacity-50"
        >
          Exportar Excel
        </button>
      </div>

      <div className="rounded-lg border border-up-border bg-up-surface overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-up-border">
          <thead className="bg-up-surface-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">ID</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Cód. alumno</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Estudiante</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Cód. curso</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Curso</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Cód. docente</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Docente</th>
              <th className="px-4 py-3 text-left font-medium text-up-text-secondary">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-up-border">
            {reclamos.map((r) => (
              <tr key={r.id} className="hover:bg-up-surface-muted">
                <td className="px-4 py-3 font-mono text-xs">#{r.id.slice(-6)}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.estudiante.codigo ?? '—'}</td>
                <td className="px-4 py-3">{r.estudiante.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.evaluacion.curso.codigo}</td>
                <td className="px-4 py-3">
                  {r.evaluacion.curso.nombre}
                  <span className="text-up-text-muted text-xs"> ({r.evaluacion.curso.seccion})</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.docente.codigo ?? '—'}</td>
                <td className="px-4 py-3">{r.docente.nombre}</td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={r.estado as EstadoReclamo} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/daar/${r.id}`} className="text-up-blue hover:underline">
                    Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
