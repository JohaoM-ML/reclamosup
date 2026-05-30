import { BarChartSimple } from '@/components/daar/charts/bar-chart-simple';
import { AnalyticsKpi } from '@/components/daar/panels/analytics-kpi';
import { InsightBox } from '@/components/daar/panels/insight-box';
import type { getAnalyticsVolumen } from '@/lib/services/analytics-daar.service';

type Data = Awaited<ReturnType<typeof getAnalyticsVolumen>>;

export function VolumenPanel({ data }: { data: Data }) {
  const parcialFinalData = data.parcialFinalPorFacultad.map((f) => ({
    facultad: f.facultad,
    Parcial: f.parcial,
    Final: f.final,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <AnalyticsKpi label="Total reclamos" value={data.total} />
        <AnalyticsKpi label="Parcial" value={data.parcial} />
        <AnalyticsKpi label="Final" value={data.final} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Por facultad</h3>
          <BarChartSimple
            data={data.porFacultad}
            xKey="facultad"
            series={[{ dataKey: 'count', fill: '#8b5cf6', name: 'Reclamos' }]}
          />
        </div>
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Parcial vs final por facultad</h3>
          <BarChartSimple
            data={parcialFinalData}
            xKey="facultad"
            series={[
              { dataKey: 'Parcial', fill: '#6366f1', name: 'Parcial' },
              { dataKey: 'Final', fill: '#22c55e', name: 'Final' },
            ]}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Top cursos</h3>
          <BarChartSimple
            data={data.topCursos.map((c) => ({ nombre: c.nombre.slice(0, 28), count: c.count }))}
            xKey="nombre"
            series={[{ dataKey: 'count', fill: '#f59e0b', name: 'Reclamos' }]}
            layout="horizontal"
            height={320}
          />
        </div>
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Top docentes</h3>
          <BarChartSimple
            data={data.topDocentes.map((d) => ({
              nombre: d.nombre.split(' ').slice(0, 2).join(' '),
              count: d.count,
            }))}
            xKey="nombre"
            series={[{ dataKey: 'count', fill: '#0ea5e9', name: 'Reclamos' }]}
            layout="horizontal"
          />
        </div>
      </div>

      <InsightBox text={data.insight} />
    </div>
  );
}
