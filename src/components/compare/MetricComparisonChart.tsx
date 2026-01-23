'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioPerformance } from '@/types';
import { formatPercent } from '@/lib/utils';

interface MetricComparisonChartProps {
  performances: { name: string; performance: PortfolioPerformance }[];
  metricKey: keyof PortfolioPerformance;
  title: string;
  formatValue?: (value: number) => string;
  higherIsBetter?: boolean;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export const MetricComparisonChart: React.FC<MetricComparisonChartProps> = ({
  performances,
  metricKey,
  title,
  formatValue = (v) => v.toFixed(2),
  higherIsBetter = true,
}) => {
  const data = performances.map((p, index) => ({
    name: p.name,
    value: Number(p.performance[metricKey]) || 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Find the best value
  const values = data.map((d) => d.value);
  const bestValue = higherIsBetter
    ? Math.max(...values)
    : Math.min(...values);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">{title}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number | undefined) => [formatValue(value ?? 0), title]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.value === bestValue ? '#10b981' : entry.color}
                  opacity={entry.value === bestValue ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
