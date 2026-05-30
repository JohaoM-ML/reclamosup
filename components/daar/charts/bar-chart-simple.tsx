'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Series = { dataKey: string; fill: string; name?: string };

type Props = {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  layout?: 'horizontal' | 'vertical';
  height?: number;
};

export function BarChartSimple({ data, xKey, series, layout = 'vertical', height = 280 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout === 'horizontal' ? 'vertical' : 'horizontal'}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        {layout === 'horizontal' ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey={xKey} width={90} tick={{ fontSize: 11 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          </>
        )}
        <Tooltip />
        {series.length > 1 && <Legend />}
        {series.map((s) => (
          <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.fill} name={s.name ?? s.dataKey} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
