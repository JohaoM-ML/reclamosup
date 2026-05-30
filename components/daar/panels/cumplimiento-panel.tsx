import { LineChartSimple } from '@/components/daar/charts/line-chart-simple';
import { BarChartSimple } from '@/components/daar/charts/bar-chart-simple';
import { AnalyticsKpi } from '@/components/daar/panels/analytics-kpi';
import { InsightBox } from '@/components/daar/panels/insight-box';
import type { getAnalyticsCumplimiento } from '@/lib/services/analytics-daar.service';

type Data = Awaited<ReturnType<typeof getAnalyticsCumplimiento>>;

export function CumplimientoPanel({ data }: { data: Data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AnalyticsKpi
          label="Formularios correctos"
          value={`${data.pctFormulariosOk}%`}
          meta={`Meta: ${data.metaFormularios}%`}
          ok={data.pctFormulariosOk >= data.metaFormularios}
        />
        <AnalyticsKpi
          label="Docentes en plazo"
          value={`${data.pctDocentesPlazo}%`}
          meta={`Meta: ${data.metaDocentes}%`}
          ok={data.pctDocentesPlazo >= data.metaDocentes}
        />
        <AnalyticsKpi
          label="Registrado en sistema"
          value={`${data.pctPowerCampus}%`}
          meta={`Meta: ${data.metaPowerCampus}%`}
        />
        <AnalyticsKpi label="Reincidencia" value={`${data.pctReincidencia}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Docentes en plazo por facultad</h3>
          <BarChartSimple
            data={data.docentesPorFacultad}
            xKey="facultad"
            series={[{ dataKey: 'pct', fill: '#6366f1', name: '% en plazo' }]}
          />
        </div>
        <div className="rounded-lg border border-up-border bg-up-surface p-4">
          <h3 className="text-sm font-semibold text-up-text mb-3">Formularios correctos por semana</h3>
          <LineChartSimple
            data={data.evolucionFormularios}
            xKey="semana"
            series={[{ dataKey: 'pct', stroke: '#22c55e', name: '% formularios OK' }]}
            referenceLine={{ y: data.metaFormularios, label: `Meta ${data.metaFormularios}%` }}
          />
        </div>
      </div>

      <InsightBox text={data.insight} />
    </div>
  );
}
