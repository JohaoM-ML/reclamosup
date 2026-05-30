import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getBandejaDocente } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { tomarReclamoFormAction } from '@/app/actions/reclamo.actions';

export default async function DocentePage() {
  const session = await getSession();
  if (!session || session.rol !== 'docente') redirect('/login');

  const reclamos = await getBandejaDocente(session.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bandeja de reclamos</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Casos asignados a tus cursos. Revisa el examen digital escaneado por DAAR.
      </p>

      {reclamos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No hay reclamos pendientes en tu bandeja.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estudiante</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Curso / Evaluación</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Motivo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reclamos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.estudiante.nombre}</td>
                  <td className="px-4 py-3">
                    {r.evaluacion.curso.nombre}
                    <br />
                    <span className="text-gray-500">{r.evaluacion.nombre}</span>
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado} />
                  </td>
                  <td className="px-4 py-3">{r.motivo.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {r.estado === 'ENVIADO' && (
                      <form action={tomarReclamoFormAction.bind(null, r.id)} className="inline">
                        <button
                          type="submit"
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                        >
                          Tomar caso
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/docente/${r.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
