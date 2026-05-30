import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamoById } from '@/lib/services/reclamo.service';
import {
  cerrarReclamoFormAction,
  devolverADocenteFormAction,
} from '@/app/actions/reclamo.actions';
import { AnularSolicitudButton } from '@/components/daar/anular-solicitud-button';
import { ReclamoDetailLayout } from '@/components/reclamos/reclamo-detail-layout';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

export default async function DaarDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.rol !== 'daar') redirect('/login');

  const { id } = await params;
  const reclamo = await getReclamoById(id);

  const actions = (
    <>
      {reclamo.estado === 'ENVIADO' && <AnularSolicitudButton reclamoId={id} />}
      {reclamo.estado === 'EN_VALIDACION' && (
        <div className="flex flex-wrap gap-3">
          <form action={cerrarReclamoFormAction.bind(null, id)}>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Cerrar — nota registrada
            </Button>
          </form>
          <form action={devolverADocenteFormAction.bind(null, id, 'Información incompleta')}>
            <Button type="submit" variant="outline">
              Devolver a docente
            </Button>
          </form>
        </div>
      )}
    </>
  );

  const metaCard =
    reclamo.operador || reclamo.archivoHash ? (
      <Card>
        <CardBody className="space-y-1 text-xs text-up-text-muted">
          {reclamo.archivoHash && <p>Hash SHA-256: {reclamo.archivoHash}</p>}
          {reclamo.escaneadoAt && (
            <p>Escaneado: {new Date(reclamo.escaneadoAt).toLocaleString('es-PE')}</p>
          )}
          {reclamo.operador && <p>Operador: {reclamo.operador.nombre}</p>}
        </CardBody>
      </Card>
    ) : null;

  return (
    <ReclamoDetailLayout
      reclamo={reclamo}
      id={id}
      backHref={reclamo.estado === 'EN_VALIDACION' ? '/daar/dashboard' : undefined}
      backLabel="Dashboard DAAR"
      pdfTitle="Examen escaneado"
      title={`Expediente #${id.slice(-6)}`}
      actions={actions}
      sidebar={metaCard}
    />
  );
}
