import { BarChartSimple } from '@/components/daar/charts/bar-chart-simple';
import { LineChartSimple } from '@/components/daar/charts/line-chart-simple';
import { AnalyticsKpi } from '@/components/daar/panels/analytics-kpi';
import { InsightBox } from '@/components/daar/panels/insight-box';
import type { getAnalyticsEficiencia } from '@/lib/services/analytics-daar.service';

type Data = Awaited<ReturnType<typeof getAnalyticsEficiencia>>;

export function EficienciaPanel({ data }: { data: Data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AnalyticsKpi label="Backlog actual" value={data.backlog} />
        <AnalyticsKpi label="Pico semanal" value={data.picoSemanal} meta={`Semana S${data.semanaPico}`} />
        <AnalyticsKpi
          label="SLA cierre global"
          value={`${data.pctSlaGlobal}%`}
          meta={`Meta: ${data.metaSla}%`}
          ok={data.pctSlaGlobal >= data.metaSla}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Reclamos creados por semana</h3>
          <BarChartSimple
            data={data.picoPorSemana}
            xKey="semana"
            series={[{ dataKey: 'count', fill: '#f59e0b', name: 'Nuevos' }]}
          />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">SLA cierre por semana</h3>
          <LineChartSimple
            data={data.slaSemanal}
            xKey="semana"
            series={[{ dataKey: 'pct', stroke: '#6366f1', name: '% SLA' }]}
            referenceLine={{ y: data.metaSla, label: `Meta ${data.metaSla}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Acumulado creados vs cerrados</h3>
        <LineChartSimple
          data={data.backlogVsResuelto}
          xKey="semana"
          series={[
            { dataKey: 'creados', stroke: '#f59e0b', name: 'Acum. creados' },
            { dataKey: 'cerrados', stroke: '#22c55e', name: 'Acum. cerrados' },
          ]}
        />
      </div>

      <InsightBox text={data.insight} />
    </div>
  );
}
