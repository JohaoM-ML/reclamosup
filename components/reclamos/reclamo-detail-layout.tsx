import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Tag } from '@/components/ui/tag';
import { EstadoBadge } from '@/components/reclamos/estado-badge';
import { PdfViewer } from '@/components/reclamos/pdf-viewer';
import {
  ReclamoDetalleInfo,
  ReclamoTimeline,
} from '@/components/reclamos/reclamo-timeline';
import { ReclamoProgressTimeline } from '@/components/reclamos/reclamo-progress-timeline';
import { linkClass } from '@/lib/types';
import type { EstadoReclamo } from '@/lib/types';

type ReclamoDetail = Awaited<
  ReturnType<typeof import('@/lib/services/reclamo.service').getReclamoById>
>;

export function ReclamoDetailLayout({
  reclamo,
  id,
  backHref,
  backLabel,
  pdfTitle,
  progress,
  actions,
  sidebar,
  title,
}: {
  reclamo: ReclamoDetail;
  id: string;
  backHref?: string;
  backLabel?: string;
  pdfTitle?: string;
  progress?: boolean;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="space-y-6">
      {backHref && (
        <Link href={backHref} className={linkClass}>
          ← {backLabel ?? 'Volver'}
        </Link>
      )}

      <PageHeader
        title={title ?? `Reclamo #${id.slice(-6)}`}
        action={<EstadoBadge estado={reclamo.estado} />}
      />

      {actions}

      {progress && (
        <ReclamoProgressTimeline estado={reclamo.estado as EstadoReclamo} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardBody>
              <ReclamoDetalleInfo reclamo={reclamo} />
            </CardBody>
          </Card>
          {sidebar}
          <Card>
            <CardBody>
              <ReclamoTimeline eventos={reclamo.eventos} />
            </CardBody>
          </Card>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-up-text-secondary">
              {pdfTitle ?? 'Examen escaneado'}
            </h3>
            {reclamo.archivoPath && <Tag>Devolución virtual</Tag>}
          </div>
          <PdfViewer reclamoId={reclamo.id} archivoPath={reclamo.archivoPath} />
        </div>
      </div>
    </div>
  );
}
