import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCursosEstudiante, getImpedidoEstudiante } from '@/lib/services/reclamo.service';
import { NuevoReclamoForm } from '@/components/estudiante/nuevo-reclamo-form';
import { Card, CardBody } from '@/components/ui/card';
import { InfoBox } from '@/components/ui/info-box';
import { PageHeader } from '@/components/ui/page-header';

export default async function NuevoReclamoPage() {
  const session = await getSession();
  if (!session || session.rol !== 'estudiante') redirect('/login');

  const [cursos, impedidoHasta] = await Promise.all([
    getCursosEstudiante(session.id),
    getImpedidoEstudiante(session.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Nuevo reclamo — CAP"
        description="Escanee su examen y complete el formulario. El reclamo se envía directamente al docente."
      />

      {impedidoHasta && (
        <InfoBox variant="danger" className="mb-6">
          Está impedido de presentar reclamos hasta el semestre <strong>{impedidoHasta}</strong>{' '}
          (3 reclamos no procedentes en el semestre anterior).
        </InfoBox>
      )}

      <Card>
        <CardBody>
          <NuevoReclamoForm cursos={cursos} />
        </CardBody>
      </Card>
    </div>
  );
}
