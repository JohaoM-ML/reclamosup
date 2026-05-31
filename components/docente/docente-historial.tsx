import Link from 'next/link';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import type { getHistorialDocente } from '@/lib/services/reclamo.service';
import { ESTADO_LABELS, RESULTADO_FINAL_LABELS, type EstadoReclamo, type ResultadoFinal } from '@/lib/types';

type Reclamo = Awaited<ReturnType<typeof getHistorialDocente>>[number];

export function DocenteSidebarHistorial({ reclamos }: { reclamos: Reclamo[] }) {
  if (reclamos.length === 0) return null;

  return (
    <div className="mt-8 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center justify-between px-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Historial reciente
        </p>
        <Link
          href="/docente/historial"
          className="text-[10px] font-medium text-up-blue hover:underline"
        >
          Ver todo
        </Link>
      </div>
      <ul className="space-y-1">
        {reclamos.map((r) => (
          <li key={r.id}>
            <Link
              href={`/docente/${r.id}`}
              className="block rounded-md px-3 py-2 transition-colors hover:bg-white/10"
            >
              <p className="truncate text-xs font-medium text-white/90">{r.estudiante.nombre}</p>
              <p className="truncate text-[11px] text-white/55">{r.evaluacion.curso.nombre}</p>
              <p className="mt-1 text-[10px] text-white/45">
                {ESTADO_LABELS[r.estado as EstadoReclamo] ?? r.estado}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocenteHistorialTable({ reclamos }: { reclamos: Reclamo[] }) {
  if (reclamos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-up-border bg-up-surface px-6 py-10 text-center text-sm text-up-text-secondary">
        Aún no hay reclamos resueltos en tus cursos.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-up-border bg-up-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-up-border text-sm">
          <thead className="bg-up-surface-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                Estudiante
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                Curso / Evaluación
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                Resultado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                Nota
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                Resuelto
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-up-border">
            {reclamos.map((r) => (
              <tr key={r.id} className="hover:bg-up-surface-muted/60">
                <td className="px-4 py-3 font-medium text-up-text">{r.estudiante.nombre}</td>
                <td className="px-4 py-3">
                  <span className="text-up-text">{r.evaluacion.curso.nombre}</span>
                  <br />
                  <span className="text-up-text-muted">{r.evaluacion.nombre}</span>
                </td>
                <td className="px-4 py-3 text-up-text-secondary">
                  {r.resultadoFinal
                    ? RESULTADO_FINAL_LABELS[r.resultadoFinal as ResultadoFinal]
                    : r.decision?.replace(/_/g, ' ') ?? '—'}
                </td>
                <td className="px-4 py-3 text-up-text">
                  {r.notaAnterior}
                  {r.notaNueva != null && (
                    <span className="ml-1 font-medium text-emerald-600">→ {r.notaNueva}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={r.estado} />
                </td>
                <td className="px-4 py-3 text-up-text-muted">
                  {new Date(r.updatedAt).toLocaleDateString('es-PE')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/docente/${r.id}`}
                    className="text-sm font-medium text-up-blue hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
