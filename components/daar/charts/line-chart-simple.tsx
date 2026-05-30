'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Series = { dataKey: string; stroke: string; name?: string };

type Props = {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  referenceLine?: { y: number; label?: string };
  height?: number;
};

export function LineChartSimple({ data, xKey, series, referenceLine, height = 280 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        {series.length > 1 && <Legend />}
        {referenceLine && (
          <ReferenceLine
            y={referenceLine.y}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={referenceLine.label}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            stroke={s.stroke}
            name={s.name ?? s.dataKey}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
