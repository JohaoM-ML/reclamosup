'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const DEFAULT_COLORS = ['#22c55e', '#94a3b8', '#ef4444', '#6366f1', '#f59e0b'];

type Props = {
  data: { name: string; value: number; pct?: number }[];
  colors?: string[];
  height?: number;
};

export function DonutChartSimple({ data, colors = DEFAULT_COLORS, height = 260 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name, item) => {
            const n = typeof value === 'number' ? value : Number(value ?? 0);
            const pct = (item?.payload as { pct?: number } | undefined)?.pct;
            return pct != null ? [`${n} (${pct}%)`, name] : [n, name];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
