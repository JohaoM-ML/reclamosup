'use client';

import Link from 'next/link';
import { KpiCards } from '@/components/daar/kpi-cards';
import { PivotTable } from '@/components/daar/pivot-table';
import { PendientesDocenteTable } from '@/components/daar/pendientes-docente-table';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import {
  registrarEntregaFisicaFormAction,
  cerrarReclamoFormAction,
} from '@/app/actions/reclamo.actions';
import type { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';
import type { getPendientesCierre, getTodosReclamos } from '@/lib/services/reclamo.service';

type DashboardData = Awaited<ReturnType<typeof getDashboardDaarData>>;

type Props = {
  data: DashboardData;
  semestre: string;
  pendientesCierre: Awaited<ReturnType<typeof getPendientesCierre>>;
  todos: Awaited<ReturnType<typeof getTodosReclamos>>;
};

export function OperativoPanel({ data, semestre, pendientesCierre, todos }: Props) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Indicadores</h2>
        <KpiCards kpis={data.kpis} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Resumen por tipo de evaluación (cerrados)
        </h2>
        <PivotTable pivot={data.pivot} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pendientes por docente</h2>
        <PendientesDocenteTable rows={data.porDocente} semestre={semestre} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pendientes por curso</h2>
        {data.porCurso.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin pendientes por curso.</p>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Curso</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sección</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Docente</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Pendientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.porCurso.map((c) => (
                  <tr key={`${c.codigo}-${c.seccion}`}>
                    <td className="px-4 py-3 font-mono text-xs">{c.codigo}</td>
                    <td className="px-4 py-3">{c.nombre}</td>
                    <td className="px-4 py-3 font-medium">{c.seccion}</td>
                    <td className="px-4 py-3">{c.docenteNombre}</td>
                    <td className="px-4 py-3 text-right">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Por departamento</h2>
        <div className="space-y-2">
          {data.porDepartamento.map((dept) => (
            <details key={dept.departamento} className="bg-white rounded-lg border">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900">
                {dept.departamento} ({dept.docentes.reduce((s, d) => s + d.total, 0)} reclamos)
              </summary>
              <div className="px-4 pb-4 space-y-3">
                {dept.docentes.map((doc) => (
                  <div key={doc.docenteId} className="border-l-2 border-indigo-200 pl-3">
                    <p className="text-sm font-medium">{doc.nombre}</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                      {doc.cursos.map((c) => (
                        <li key={c.codigo}>
                          {c.codigo} — {c.nombre}: {c.count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Entregas físicas pendientes ({data.entregasFisicas.length})
        </h2>
        {data.entregasFisicas.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay solicitudes de examen físico.</p>
        ) : (
          <div className="space-y-3">
            {data.entregasFisicas.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg border p-4 flex flex-wrap gap-4 items-center justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    Reclamo #{s.reclamoId.slice(-6)} — {s.reclamo.evaluacion.curso.nombre}
                  </p>
                  <p className="text-gray-600">
                    Docente: {s.docente.nombres} {s.docente.apellidoPaterno}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Solicitado: {new Date(s.solicitadoAt).toLocaleString('es-PE')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={registrarEntregaFisicaFormAction}>
                    <input type="hidden" name="solicitudId" value={s.id} />
                    <input type="hidden" name="procede" value="true" />
                    <button
                      type="submit"
                      className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700"
                    >
                      Entregar — Procede
                    </button>
                  </form>
                  <form action={registrarEntregaFisicaFormAction}>
                    <input type="hidden" name="solicitudId" value={s.id} />
                    <input type="hidden" name="procede" value="false" />
                    <button
                      type="submit"
                      className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700"
                    >
                      Entregar — No procede
                    </button>
                  </form>
                  <Link
                    href={`/daar/${s.reclamoId}`}
                    className="text-indigo-600 text-xs self-center hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Cola de cierre ({pendientesCierre.length})
        </h2>
        {pendientesCierre.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay casos pendientes de cierre.</p>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estudiante</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Curso</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Resultado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nota</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendientesCierre.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.estudiante.nombre}</td>
                    <td className="px-4 py-3">{r.evaluacion.curso.nombre}</td>
                    <td className="px-4 py-3 capitalize">
                      {r.resultadoFinal?.replace(/_/g, ' ') ?? r.decision?.replace('_', ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.notaAnterior}
                      {r.notaNueva != null && (
                        <span className="text-green-600"> → {r.notaNueva}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/daar/${r.id}`} className="text-indigo-600 hover:underline">
                        Ver
                      </Link>
                      <form action={cerrarReclamoFormAction.bind(null, r.id)} className="inline">
                        <button
                          type="submit"
                          className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700"
                        >
                          Cerrar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Todos los reclamos ({todos.length})
        </h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estudiante</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Docente</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">#{r.id.slice(-6)}</td>
                  <td className="px-4 py-3">{r.estudiante.nombre}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado} />
                  </td>
                  <td className="px-4 py-3">{r.docente.nombre}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/daar/${r.id}`} className="text-indigo-600 hover:underline">
                      Detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
