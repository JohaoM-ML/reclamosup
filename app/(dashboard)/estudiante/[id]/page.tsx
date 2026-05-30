import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamoById } from '@/lib/services/reclamo.service';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { PdfViewer } from '@/components/reclamos/pdf-viewer';
import {
  ReclamoDetalleInfo,
  ReclamoTimeline,
} from '@/components/reclamos/reclamo-timeline';

export default async function EstudianteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.rol !== 'estudiante') redirect('/login');

  const { id } = await params;
  const reclamo = await getReclamoById(id);

  if (reclamo.estudianteId !== session.id) redirect('/estudiante');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Reclamo #{id.slice(-6)}
        </h1>
        <EstadoBadge estado={reclamo.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <ReclamoDetalleInfo reclamo={reclamo} />
          </div>
          <div className="bg-white rounded-lg border p-4">
            <ReclamoTimeline eventos={reclamo.eventos} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Examen escaneado por DAAR
          </h3>
          <PdfViewer reclamoId={reclamo.id} archivoPath={reclamo.archivoPath} />
        </div>
      </div>
    </div>
  );
}
