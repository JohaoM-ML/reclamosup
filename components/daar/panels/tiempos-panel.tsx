import { BarChartSimple } from '@/components/daar/charts/bar-chart-simple';
import { LineChartSimple } from '@/components/daar/charts/line-chart-simple';
import { AnalyticsKpi } from '@/components/daar/panels/analytics-kpi';
import { InsightBox } from '@/components/daar/panels/insight-box';
import type { getAnalyticsTiempos } from '@/lib/services/analytics-daar.service';

type Data = Awaited<ReturnType<typeof getAnalyticsTiempos>>;

export function TiemposPanel({ data }: { data: Data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <AnalyticsKpi
          label="Promedio resolución (días)"
          value={data.promedioResolucion}
          meta={`Meta: ≤ ${data.metaResolucion} días`}
          ok={data.promedioResolucion <= data.metaResolucion}
        />
        <AnalyticsKpi
          label="Respuesta docente (días)"
          value={data.promedioRespuestaDocente}
          meta={`Meta: ≤ ${data.metaDocente} días`}
          ok={data.promedioRespuestaDocente <= data.metaDocente}
        />
        <AnalyticsKpi
          label="Reclamos cerrados analizados"
          value={data.distribucion.reduce((s, d) => s + d.count, 0)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Distribución de tiempos (días)</h3>
          <BarChartSimple
            data={data.distribucion}
            xKey="rango"
            series={[{ dataKey: 'count', fill: '#6366f1', name: 'Reclamos' }]}
          />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Promedio por facultad</h3>
          <BarChartSimple
            data={data.porFacultad}
            xKey="facultad"
            series={[{ dataKey: 'promedio', fill: '#0ea5e9', name: 'Días' }]}
            layout="horizontal"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Evolución semanal (días promedio)</h3>
        <LineChartSimple
          data={data.evolucionSemanal}
          xKey="semana"
          series={[{ dataKey: 'promedio', stroke: '#6366f1', name: 'Días resolución' }]}
          referenceLine={{ y: data.metaResolucion, label: `Meta ${data.metaResolucion}d` }}
        />
      </div>

      <InsightBox text={data.insight} />
    </div>
  );
}
