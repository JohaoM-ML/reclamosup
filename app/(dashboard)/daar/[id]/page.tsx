import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamoById } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { PdfViewer } from '@/components/reclamos/pdf-viewer';
import {
  ReclamoDetalleInfo,
  ReclamoTimeline,
} from '@/components/reclamos/reclamo-timeline';
import {
  cerrarReclamoFormAction,
  devolverADocenteFormAction,
} from '@/app/actions/reclamo.actions';
import { AnularSolicitudButton } from '@/components/daar/anular-solicitud-button';

export default async function DaarDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.rol !== 'daar') redirect('/login');

  const { id } = await params;
  const reclamo = await getReclamoById(id);

  return (
    <div className="space-y-6">
      {reclamo.estado === 'EN_VALIDACION' && (
        <Link
          href="/daar/dashboard"
          className="inline-block text-sm text-indigo-600 hover:underline"
        >
          ← Volver
        </Link>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Expediente #{id.slice(-6)}
        </h1>
        <EstadoBadge estado={reclamo.estado} />
      </div>

      {reclamo.estado === 'ENVIADO' && (
        <AnularSolicitudButton reclamoId={id} />
      )}

      {reclamo.estado === 'EN_VALIDACION' && (
        <div className="flex gap-3">
          <form action={cerrarReclamoFormAction.bind(null, id)}>
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              Cerrar — nota registrada
            </button>
          </form>
          <form
            action={devolverADocenteFormAction.bind(null, id, 'Información incompleta')}
          >
            <button
              type="submit"
              className="rounded-md bg-yellow-100 px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-200"
            >
              Devolver a docente
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <ReclamoDetalleInfo reclamo={reclamo} />
          </div>
          <div className="bg-white rounded-lg border p-4 text-xs text-gray-500">
          {reclamo.operador && (
            <>
              <p>Hash SHA-256: {reclamo.archivoHash ?? '—'}</p>
              <p>
                Escaneado:{' '}
                {reclamo.escaneadoAt
                  ? new Date(reclamo.escaneadoAt).toLocaleString('es-PE')
                  : '—'}
              </p>
              <p>Operador: {reclamo.operador.nombre}</p>
            </>
          )}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <ReclamoTimeline eventos={reclamo.eventos} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Examen escaneado</h3>
          <PdfViewer reclamoId={reclamo.id} archivoPath={reclamo.archivoPath} />
        </div>
      </div>
    </div>
  );
}
