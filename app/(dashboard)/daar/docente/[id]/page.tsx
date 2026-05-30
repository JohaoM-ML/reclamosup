import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamosPendientesDocenteDaar } from '@/lib/services/dashboard-daar.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';

export default async function DaarDocenteBandejaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semestre?: string }>;
}) {
  const session = await getSession();
  if (!session || session.rol !== 'daar') redirect('/login');

  const { id: docenteId } = await params;
  const { semestre = '2026-I' } = await searchParams;

  const { docente, reclamos } = await getReclamosPendientesDocenteDaar(docenteId, semestre);

  if (!docente) redirect('/daar/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/daar/dashboard" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard DAAR
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Bandeja del docente</h1>
        <p className="text-gray-600 text-sm mt-1">
          {docente.nombre} · {docente.email} · Semestre {semestre}
        </p>
      </div>

      {reclamos.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay reclamos pendientes de resolución.</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estudiante</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Curso</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Sección</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Evaluación</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Plazo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reclamos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.estudianteNombre}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">{r.cursoCodigo}</span>
                    <br />
                    {r.cursoNombre}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.seccion}</td>
                  <td className="px-4 py-3">{r.evaluacionNombre}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado as import('@/lib/types').EstadoReclamo} />
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.plazo).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/daar/${r.id}`} className="text-indigo-600 hover:underline">
                      Ver
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
