'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiltrosDashboard } from '@/components/daar/filtros-dashboard';
import { DashboardTabs, type DashboardTabId } from '@/components/daar/dashboard-tabs';
import { OperativoPanel } from '@/components/daar/panels/operativo-panel';
import { TiemposPanel } from '@/components/daar/panels/tiempos-panel';
import { VolumenPanel } from '@/components/daar/panels/volumen-panel';
import { CalidadPanel } from '@/components/daar/panels/calidad-panel';
import { CumplimientoPanel } from '@/components/daar/panels/cumplimiento-panel';
import { EficienciaPanel } from '@/components/daar/panels/eficiencia-panel';
import type { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';
import type { getPendientesCierre, getTodosReclamos } from '@/lib/services/reclamo.service';

type DashboardData = Awaited<ReturnType<typeof getDashboardDaarData>>;

type Props = {
  initial: DashboardData;
  pendientesCierre: Awaited<ReturnType<typeof getPendientesCierre>>;
  todos: Awaited<ReturnType<typeof getTodosReclamos>>;
};

export function DashboardClient({ initial, pendientesCierre, todos }: Props) {
  const [semestre, setSemestre] = useState('2026-I');
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<DashboardTabId>('operativo');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/daar/dashboard?semestre=${encodeURIComponent(semestre)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      /* ignore polling errors */
    }
  }, [semestre]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const analytics = data.analytics;

  return (
    <div className="space-y-6">
      <FiltrosDashboard semestre={semestre} onSemestreChange={setSemestre} />
      <DashboardTabs active={tab} onChange={setTab} />

      <div className="pt-2">
        {tab === 'operativo' && (
          <OperativoPanel
            data={data}
            semestre={semestre}
            pendientesCierre={pendientesCierre}
            todos={todos}
          />
        )}
        {tab === 'tiempos' && analytics && <TiemposPanel data={analytics.tiempos} />}
        {tab === 'volumen' && analytics && <VolumenPanel data={analytics.volumen} />}
        {tab === 'calidad' && analytics && <CalidadPanel data={analytics.calidad} />}
        {tab === 'cumplimiento' && analytics && <CumplimientoPanel data={analytics.cumplimiento} />}
        {tab === 'eficiencia' && analytics && <EficienciaPanel data={analytics.eficiencia} />}
      </div>
    </div>
  );
}
