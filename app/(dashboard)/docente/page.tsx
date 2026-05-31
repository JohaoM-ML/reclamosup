import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getBandejaDocente } from '@/lib/services/reclamo.service';
import { BandejaDocenteTable } from '@/components/docente/bandeja-docente-table';
import { PageHeader } from '@/components/ui/page-header';

export default async function DocentePage() {
  const session = await getSession();
  if (!session || session.rol !== 'docente') redirect('/login');

  const reclamos = await getBandejaDocente(session.id);

  return (
    <div>
      <PageHeader
        title="Bandeja de reclamos"
        description="Casos asignados a tus cursos."
      />

      <BandejaDocenteTable reclamos={reclamos} />
    </div>
  );
}
