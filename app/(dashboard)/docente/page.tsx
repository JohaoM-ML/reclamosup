import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getBandejaDocente } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { tomarReclamoFormAction } from '@/app/actions/reclamo.actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export default async function DocentePage() {
  const session = await getSession();
  if (!session || session.rol !== 'docente') redirect('/login');

  const reclamos = await getBandejaDocente(session.id);

  return (
    <div>
      <PageHeader
        title="Bandeja de reclamos"
        description="Casos asignados a tus cursos. Revisa el examen digital escaneado por DAAR."
      />

      {reclamos.length === 0 ? (
        <EmptyState
          title="Bandeja vacía"
          description="No hay reclamos pendientes en tus cursos por ahora."
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
                {reclamos.map((r) => (
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
                    <td className="space-x-2 px-4 py-3 text-right">
                      {r.estado === 'ENVIADO' && (
                        <form action={tomarReclamoFormAction.bind(null, r.id)} className="inline">
                          <Button type="submit" size="sm" variant="outline">
                            Tomar caso
                          </Button>
                        </form>
                      )}
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
