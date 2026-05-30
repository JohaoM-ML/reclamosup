import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getMisReclamos } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { redirect } from 'next/navigation';

export default async function EstudiantePage() {
  const session = await getSession();
  if (!session || session.rol !== 'estudiante') redirect('/login');

  const reclamos = await getMisReclamos(session.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis reclamos</h1>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <p className="text-gray-800 text-sm">
          En CAP: con el representante de aula presente, escanee su examen y registre el reclamo
          en <strong>Nuevo reclamo</strong>.
        </p>
        <a
          href="/estudiante/cap/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo reclamo (CAP)
        </a>
      </div>

      {reclamos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No tienes reclamos registrados. Acércate a CAP con tu examen y el representante de aula
          para registrar uno.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Curso</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Evaluación</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nota</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reclamos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.evaluacion.curso.nombre}</td>
                  <td className="px-4 py-3">{r.evaluacion.nombre}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado} />
                  </td>
                  <td className="px-4 py-3">
                    {r.notaAnterior}
                    {r.notaNueva != null && (
                      <span className="text-green-600 ml-1">→ {r.notaNueva}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/estudiante/${r.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Ver detalle
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
