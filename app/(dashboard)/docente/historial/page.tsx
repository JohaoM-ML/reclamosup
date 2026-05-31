import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getHistorialDocente } from '@/lib/services/reclamo.service';
import { DocenteHistorialTable } from '@/components/docente/docente-historial';
import { PageHeader } from '@/components/ui/page-header';

export default async function DocenteHistorialPage() {
  const session = await getSession();
  if (!session || session.rol !== 'docente') redirect('/login');

  const reclamos = await getHistorialDocente(session.id);

  return (
    <div>
      <PageHeader
        title="Historial de reclamos"
        description="Reclamos que ya resolviste o que fueron cerrados en tus cursos."
      />

      <DocenteHistorialTable reclamos={reclamos} />
    </div>
  );
}
