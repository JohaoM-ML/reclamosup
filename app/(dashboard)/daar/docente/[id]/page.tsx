import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamosPendientesDocenteDaar } from '@/lib/services/dashboard-daar.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { linkClass, tableHeadClass } from '@/lib/types';
import type { EstadoReclamo } from '@/lib/types';

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
      <Link href="/daar/dashboard" className={linkClass}>
        ← Dashboard DAAR
      </Link>

      <PageHeader
        title="Bandeja del docente"
        description={`${docente.nombre} · ${docente.email} · Semestre ${semestre}`}
      />

      {reclamos.length === 0 ? (
        <EmptyState
          title="Sin reclamos pendientes"
          description="Este docente no tiene casos pendientes de resolución en el semestre seleccionado."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="up-table min-w-full">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Estudiante</th>
                  <th className={tableHeadClass}>Curso</th>
                  <th className={tableHeadClass}>Sección</th>
                  <th className={tableHeadClass}>Evaluación</th>
                  <th className={tableHeadClass}>Estado</th>
                  <th className={tableHeadClass}>Plazo</th>
                  <th className={tableHeadClass} />
                </tr>
              </thead>
              <tbody>
                {reclamos.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.estudianteNombre}</td>
                    <td>
                      <span className="font-mono text-xs text-up-text-muted">{r.cursoCodigo}</span>
                      <br />
                      {r.cursoNombre}
                    </td>
                    <td>{r.seccion}</td>
                    <td>{r.evaluacionNombre}</td>
                    <td>
                      <EstadoBadge estado={r.estado as EstadoReclamo} />
                    </td>
                    <td>{new Date(r.plazo).toLocaleDateString('es-PE')}</td>
                    <td className="text-right">
                      <Link href={`/daar/${r.id}`} className={linkClass}>
                        Ver
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
