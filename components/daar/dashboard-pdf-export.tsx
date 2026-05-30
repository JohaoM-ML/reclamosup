'use client';

import { exportDashboardPdf } from '@/lib/export-dashboard-pdf';
import type { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';
import type { DashboardTabId } from '@/components/daar/dashboard-tabs';

type DashboardData = Awaited<ReturnType<typeof getDashboardDaarData>>;

const TAB_LABELS: Record<DashboardTabId, string> = {
  operativo: 'Operativo',
  tiempos: 'Tiempos',
  volumen: 'Volumen',
  calidad: 'Calidad',
  cumplimiento: 'Cumplimiento',
  eficiencia: 'Eficiencia',
};

export function DashboardPdfExport({
  data,
  semestre,
  tab,
}: {
  data: DashboardData;
  semestre: string;
  tab: DashboardTabId;
}) {
  return (
    <button
      type="button"
      onClick={() => exportDashboardPdf(data, semestre, TAB_LABELS[tab])}
      className="rounded-md border border-up-border bg-white px-3 py-1.5 text-sm font-medium text-up-text-secondary hover:bg-up-surface-muted"
    >
      Descargar KPIs (PDF)
    </button>
  );
}
