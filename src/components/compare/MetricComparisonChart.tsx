'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioPerformance, BenchmarkPerformance } from '@/types';
import { formatPercent } from '@/lib/utils';

interface MetricComparisonChartProps {
  performances: { name: string; performance: PortfolioPerformance }[];
  benchmarks?: BenchmarkPerformance[];
  metricKey: keyof PortfolioPerformance;
  title: string;
  formatValue?: (value: number) => string;
  higherIsBetter?: boolean;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

// Map portfolio metrics to benchmark metrics
const getBenchmarkValue = (
  benchmark: BenchmarkPerformance,
  metricKey: keyof PortfolioPerformance
): number | null => {
  switch (metricKey) {
    case 'totalReturnPercent':
      return benchmark.totalReturnPercent;
    case 'volatility':
      return benchmark.volatility;
    case 'sharpeRatio':
      return benchmark.sharpeRatio;
    case 'maxDrawdown':
      return benchmark.maxDrawdown;
    default:
      return null;
  }
};

export const MetricComparisonChart: React.FC<MetricComparisonChartProps> = ({
  performances,
  benchmarks = [],
  metricKey,
  title,
  formatValue = (v) => v.toFixed(2),
  higherIsBetter = true,
}) => {
  // Portfolio data
  const portfolioData = performances.map((p, index) => ({
    name: p.name,
    value: Number(p.performance[metricKey]) || 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
    isBenchmark: false,
  }));

  // Benchmark data (only include if metric is available)
  const benchmarkData = benchmarks
    .map((b) => {
      const value = getBenchmarkValue(b, metricKey);
      if (value === null) return null;
      return {
        name: b.name,
        value,
        color: b.color,
        isBenchmark: true,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const data = [...portfolioData, ...benchmarkData];

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
                  strokeDasharray={entry.isBenchmark ? '4 2' : undefined}
                  stroke={entry.isBenchmark ? entry.color : undefined}
                  strokeWidth={entry.isBenchmark ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
