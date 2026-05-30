import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamoById } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { PdfViewer } from '@/components/reclamos/pdf-viewer';
import { LapizConfirmacionGate } from '@/components/docente/lapiz-confirmacion-gate';
import { ResolverForm } from '@/components/reclamos/resolver-form';
import { SolicitarExamenFisicoButton } from '@/components/docente/solicitar-examen-fisico';
import {
  ReclamoDetalleInfo,
  ReclamoTimeline,
} from '@/components/reclamos/reclamo-timeline';

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
  const activo = ['ENVIADO', 'EN_REVISION', 'EN_VALIDACION'].includes(reclamo.estado);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Revisar reclamo #{id.slice(-6)}
        </h1>
        <EstadoBadge estado={reclamo.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <ReclamoDetalleInfo reclamo={reclamo} />
          </div>
          {puedeResolver &&
            (requiereConfirmacionLapiz ? (
              <LapizConfirmacionGate reclamoId={reclamo.id} />
            ) : (
              <ResolverForm reclamoId={reclamo.id} />
            ))}
          {activo && (
            <SolicitarExamenFisicoButton
              reclamoId={reclamo.id}
              yaSolicitado={!!reclamo.solicitudExamenFisico}
            />
          )}
          <div className="bg-white rounded-lg border p-4">
            <ReclamoTimeline eventos={reclamo.eventos} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Examen escaneado — devolución virtual
          </h3>
          {reclamo.archivoPath && (
            <span className="inline-block mb-2 text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
              Devolución virtual disponible
            </span>
          )}
          <PdfViewer reclamoId={reclamo.id} archivoPath={reclamo.archivoPath} />
        </div>
      </div>
    </div>
  );
}
