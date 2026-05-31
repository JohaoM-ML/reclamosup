'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { getBandejaDocente } from '@/lib/services/reclamo.service';
import { inputClass, labelClass } from '@/lib/types';

type Reclamo = Awaited<ReturnType<typeof getBandejaDocente>>[number];

function cursoKey(r: Reclamo) {
  const c = r.evaluacion.curso;
  return `${c.codigo}:${c.seccion}`;
}

function cursoLabel(r: Reclamo) {
  const c = r.evaluacion.curso;
  return `${c.codigo} — ${c.nombre} (Secc. ${c.seccion})`;
}

export function BandejaDocenteTable({ reclamos }: { reclamos: Reclamo[] }) {
  const [cursoFiltro, setCursoFiltro] = useState('');

  const cursos = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reclamos) {
      const key = cursoKey(r);
      if (!map.has(key)) map.set(key, cursoLabel(r));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [reclamos]);

  const filtrados = useMemo(
    () => (cursoFiltro ? reclamos.filter((r) => cursoKey(r) === cursoFiltro) : reclamos),
    [reclamos, cursoFiltro]
  );

  if (reclamos.length === 0) {
    return (
      <EmptyState
        title="Bandeja vacía"
        description="No hay reclamos pendientes en tus cursos por ahora."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-up-border bg-up-surface p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="filtro-curso" className={labelClass}>
            Filtrar por curso
          </label>
          <select
            id="filtro-curso"
            value={cursoFiltro}
            onChange={(e) => setCursoFiltro(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos los cursos ({reclamos.length})</option>
            {cursos.map(([key, label]) => {
              const count = reclamos.filter((r) => cursoKey(r) === key).length;
              return (
                <option key={key} value={key}>
                  {label} ({count})
                </option>
              );
            })}
          </select>
        </div>
        <p className="pb-2 text-sm text-up-text-secondary">
          {filtrados.length === reclamos.length
            ? `${reclamos.length} reclamo(s)`
            : `${filtrados.length} de ${reclamos.length} reclamo(s)`}
        </p>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No hay reclamos para el curso seleccionado."
          action={
            <button
              type="button"
              onClick={() => setCursoFiltro('')}
              className="text-sm font-medium text-up-blue hover:underline"
            >
              Ver todos los cursos
            </button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
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
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                    Motivo
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-up-border bg-up-surface">
                {filtrados.map((r) => (
                  <tr key={r.id} className="hover:bg-up-surface-muted/60">
                    <td className="px-4 py-3 font-medium text-up-text">{r.estudiante.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="text-up-text">{r.evaluacion.curso.nombre}</span>
                      <br />
                      <span className="text-up-text-muted">{r.evaluacion.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={r.estado} />
                    </td>
                    <td className="px-4 py-3 capitalize text-up-text-secondary">
                      {r.motivo.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/docente/${r.id}`}
                        className="text-sm font-medium text-up-blue hover:underline"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
