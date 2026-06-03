import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamoById } from '@/lib/services/reclamo.service';
import { LapizConfirmacionGate } from '@/components/docente/lapiz-confirmacion-gate';
import { SolicitarExamenFisicoButton } from '@/components/docente/solicitar-examen-fisico-button';
import { ResolverForm } from '@/components/reclamos/resolver-form';
import { ReclamoDetailLayout } from '@/components/reclamos/reclamo-detail-layout';
import { Card, CardBody } from '@/components/ui/card';

export default async function DocenteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.rol !== 'docente') redirect('/login');

  const { id } = await params;
  const reclamo = await getReclamoById(id);

  if (reclamo.docenteId !== session.id) redirect('/docente');

  const puedeResolver = ['ENVIADO', 'EN_REVISION'].includes(reclamo.estado);
  const requiereConfirmacionLapiz = reclamo.estado === 'EN_REVISION';

  const sidebar = (
    <>
      <Card>
        <CardBody>
          <SolicitarExamenFisicoButton
            reclamoId={reclamo.id}
            estado={reclamo.estado}
            solicitud={reclamo.solicitudExamenFisico}
          />
        </CardBody>
      </Card>
      {puedeResolver && (
        <Card>
          <CardBody>
            {requiereConfirmacionLapiz ? (
              <LapizConfirmacionGate reclamoId={reclamo.id} />
            ) : (
              <ResolverForm reclamoId={reclamo.id} />
            )}
          </CardBody>
        </Card>
      )}
    </>
  );

  return (
    <ReclamoDetailLayout
      reclamo={reclamo}
      id={id}
      backHref="/docente"
      backLabel="Bandeja de reclamos"
      pdfTitle="Examen escaneado — devolución virtual"
      sidebar={sidebar}
    />
  );
}
