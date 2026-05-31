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

  const impedidoHasta = await getImpedidoEstudiante(session.id);

  if (impedidoHasta) {
    return (
      <div>
        <PageHeader
          title="Nuevo reclamo — CAP"
          description="No puede registrar reclamos mientras dure el impedimento."
        />
        <Card>
          <CardBody>
            <InfoBox variant="danger">
              Está impedido de presentar reclamos hasta el semestre{' '}
              <strong>{impedidoHasta}</strong> por acumular tres reclamos no procedentes en el
              semestre anterior.
              <p className="mt-3 text-up-text-secondary">
                Puede revisar el historial de sus reclamos desde el panel principal.
              </p>
            </InfoBox>
          </CardBody>
        </Card>
      </div>
    );
  }

  const cursos = await getCursosEstudiante(session.id);

  return (
    <div>
      <PageHeader
        title="Nuevo reclamo — CAP"
        description="Escanee su examen y complete el formulario. El reclamo se envía directamente al docente."
      />

      <Card>
        <CardBody>
          <NuevoReclamoForm cursos={cursos} />
        </CardBody>
      </Card>
    </div>
  );
}
