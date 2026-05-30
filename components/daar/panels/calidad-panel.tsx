import { BarChartSimple } from '@/components/daar/charts/bar-chart-simple';
import { DonutChartSimple } from '@/components/daar/charts/donut-chart-simple';
import { AnalyticsKpi } from '@/components/daar/panels/analytics-kpi';
import { InsightBox } from '@/components/daar/panels/insight-box';
import type { getAnalyticsCalidad } from '@/lib/services/analytics-daar.service';

type Data = Awaited<ReturnType<typeof getAnalyticsCalidad>>;

export function CalidadPanel({ data }: { data: Data }) {
  const stackedDocentes = data.topDocentes.map((d) => ({
    nombre: d.nombre.split(' ').slice(0, 2).join(' '),
    Sube: d.subeCount,
    'Sin cambio': d.sinCambioCount,
    Baja: d.bajaCount,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <AnalyticsKpi label="Nota sube" value={`${data.pctSube}%`} />
        <AnalyticsKpi label="Sin cambio" value={`${data.pctSinCambio}%`} />
        <AnalyticsKpi label="Nota baja" value={`${data.pctBaja}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Distribución de resultados</h3>
          <DonutChartSimple
            data={data.donut}
            colors={['#22c55e', '#94a3b8', '#ef4444']}
          />
        </div>
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Delta puntos por facultad</h3>
          <BarChartSimple
            data={data.deltaPorFacultad}
            xKey="facultad"
            series={[{ dataKey: 'delta', fill: '#22c55e', name: 'Puntos' }]}
          />
        </div>
      </div>

      <div className="rounded-lg border border-up-border bg-up-surface p-4">
        <h3 className="text-sm font-semibold text-up-text mb-3">Top 5 docentes (conteo por resultado)</h3>
        <BarChartSimple
          data={stackedDocentes}
          xKey="nombre"
          series={[
            { dataKey: 'Sube', fill: '#22c55e', name: 'Sube' },
            { dataKey: 'Sin cambio', fill: '#94a3b8', name: 'Sin cambio' },
            { dataKey: 'Baja', fill: '#ef4444', name: 'Baja' },
          ]}
          layout="horizontal"
          height={320}
        />
      </div>

      <InsightBox text={data.insight} />
    </div>
  );
}
