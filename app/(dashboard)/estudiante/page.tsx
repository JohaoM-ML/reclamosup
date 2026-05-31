import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getMisReclamos } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { redirect } from 'next/navigation';

export default async function EstudiantePage() {
  const session = await getSession();
  if (!session || session.rol !== 'estudiante') redirect('/login');

  const reclamos = await getMisReclamos(session.id);

  return (
    <div>
      <PageHeader
        title="Mis reclamos"
        description="En CAP, escanee su examen y registre el reclamo."
        action={
          <Link href="/estudiante/cap/nuevo">
            <Button>+ Nuevo reclamo (CAP)</Button>
          </Link>
        }
      />

      {reclamos.length === 0 ? (
        <EmptyState
          title="Sin reclamos registrados"
          description="Acércate a CAP con tu examen para registrar un reclamo."
          action={
            <Link href="/estudiante/cap/nuevo">
              <Button>Registrar reclamo</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-up-border text-sm">
              <thead className="bg-up-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                    Curso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                    Evaluación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary">
                    Nota
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-up-border bg-up-surface">
                {reclamos.map((r) => (
                  <tr key={r.id} className="hover:bg-up-surface-muted/60">
                    <td className="px-4 py-3 font-medium text-up-text">
                      {r.evaluacion.curso.nombre}
                    </td>
                    <td className="px-4 py-3 text-up-text-secondary">{r.evaluacion.nombre}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={r.estado} />
                    </td>
                    <td className="px-4 py-3 text-up-text">
                      {r.notaAnterior}
                      {r.notaNueva != null && (
                        <span className="ml-1 font-medium text-emerald-600">→ {r.notaNueva}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/estudiante/${r.id}`}
                        className="text-sm font-medium text-up-blue hover:underline"
                      >
                        Ver detalle
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
