'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { BenchmarkPerformance, PortfolioPerformance } from '@/types';

interface PortfolioData {
  name: string;
  color: string;
  performance: PortfolioPerformance;
  createdAt?: string; // Portfolio creation date (ISO string)
  realHistoricalData?: { date: string; value: number; return: number }[]; // Real data from Yahoo Finance
}

interface PerformanceLineChartProps {
  portfolios: PortfolioData[];
  benchmarks: BenchmarkPerformance[];
}

const PORTFOLIO_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({
  portfolios,
  benchmarks,
}) => {
  // Get portfolio creation dates
  const portfolioCreationDates = useMemo(() => {
    return portfolios.map((p) => {
      if (p.createdAt) {
        return p.createdAt.split('T')[0];
      }
      return null;
    });
  }, [portfolios]);

  // Merge and normalize all data series to start at 100
  const chartData = useMemo(() => {
    // Collect all unique dates from benchmarks
    const allDates = new Set<string>();
    benchmarks.forEach((b) => {
      b.normalizedData.forEach((d) => allDates.add(d.date));
    });

    // Also add portfolio historical data dates if available
    // Prefer realHistoricalData over performance.historicalData
    portfolios.forEach((p) => {
      const historicalData = p.realHistoricalData || p.performance.historicalData;
      historicalData?.forEach((d) => allDates.add(d.date));
    });

    const sortedDates = Array.from(allDates).sort();

    if (sortedDates.length === 0) return [];

    // Build merged data
    return sortedDates.map((date) => {
      const point: Record<string, string | number | undefined> = { date };

      // Add benchmark values
      benchmarks.forEach((b) => {
        const dataPoint = b.normalizedData.find((d) => d.date === date);
        if (dataPoint) {
          point[b.symbol] = dataPoint.value;
        }
      });

      // Add portfolio values (normalized) - split into actual and simulated
      // Prefer realHistoricalData over performance.historicalData
      portfolios.forEach((p, index) => {
        const historicalData = p.realHistoricalData || p.performance.historicalData;
        if (historicalData && historicalData.length > 0) {
          const dataPoint = historicalData.find((d) => d.date === date);
          const firstValue = historicalData[0].value;
          if (dataPoint && firstValue > 0) {
            const normalizedValue = (dataPoint.value / firstValue) * 100;
            const creationDate = portfolioCreationDates[index];

            // Determine if this date is before or after portfolio creation
            if (creationDate && date < creationDate) {
              // Simulated (before creation)
              point[`portfolio_${index}_simulated`] = normalizedValue;
            } else {
              // Actual (after creation or no creation date)
              point[`portfolio_${index}_actual`] = normalizedValue;
            }

            // For the transition point (creation date), include in both
            if (creationDate && date === creationDate) {
              point[`portfolio_${index}_simulated`] = normalizedValue;
            }
          }
        }
      });

      return point;
    });
  }, [portfolios, benchmarks, portfolioCreationDates]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    // Group portfolio actual/simulated together
    const groupedPayload: Array<{ name: string; value: number; color: string; isSimulated: boolean }> = [];
    const processedPortfolios = new Set<string>();

    payload.forEach((entry) => {
      const dataKey = entry.dataKey;

      // Check if this is a portfolio entry
      const portfolioMatch = dataKey.match(/^portfolio_(\d+)_(actual|simulated)$/);
      if (portfolioMatch) {
        const portfolioIndex = portfolioMatch[1];
        if (!processedPortfolios.has(portfolioIndex)) {
          processedPortfolios.add(portfolioIndex);
          const isSimulated = portfolioMatch[2] === 'simulated';
          groupedPayload.push({
            name: entry.name.replace(' (Projected)', '').replace(' (Actual)', ''),
            value: entry.value,
            color: entry.color,
            isSimulated,
          });
        }
      } else {
        // Benchmark entry
        groupedPayload.push({
          name: entry.name,
          value: entry.value,
          color: entry.color,
          isSimulated: false,
        });
      }
    });

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label ? formatDate(label) : ''}</p>
        <div className="space-y-1">
          {groupedPayload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">
                {entry.name}
                {entry.isSimulated && <span className="text-slate-500 text-xs ml-1">(projected)</span>}
              </span>
              <span className="text-white font-medium">
                {(entry.value - 100).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Check if any portfolio has simulated data
  const hasSimulatedData = portfolioCreationDates.some((date) => date !== null);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          Select portfolios or benchmarks to view performance comparison
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${(value - 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value: string) => {
                // Clean up legend labels
                const cleanValue = value.replace(' (Projected)', '').replace(' (Actual)', '');
                return <span className="text-slate-300 text-sm">{cleanValue}</span>;
              }}
            />
            <ReferenceLine y={100} stroke="#475569" strokeDasharray="3 3" />

            {/* Portfolio lines - Simulated (before creation) */}
            {portfolios.map((p, index) => {
              const creationDate = portfolioCreationDates[index];
              if (!creationDate) return null;

              return (
                <Line
                  key={`portfolio_${index}_simulated`}
                  type="monotone"
                  dataKey={`portfolio_${index}_simulated`}
                  name={`${p.name} (Projected)`}
                  stroke={p.color || PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  dot={false}
                  connectNulls
                  legendType="none"
                />
              );
            })}

            {/* Portfolio lines - Actual (after creation) */}
            {portfolios.map((p, index) => (
              <Line
                key={`portfolio_${index}_actual`}
                type="monotone"
                dataKey={`portfolio_${index}_actual`}
                name={portfolioCreationDates[index] ? `${p.name} (Actual)` : p.name}
                stroke={p.color || PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}

            {/* Benchmark lines */}
            {benchmarks.map((b) => (
              <Line
                key={b.symbol}
                type="monotone"
                dataKey={b.symbol}
                name={b.name}
                stroke={b.color}
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 mt-2">
        <span>Performance normalized to 100 at start.</span>
        {hasSimulatedData && (
          <span className="flex items-center gap-1">
            <span className="w-6 h-0 border-t-2 border-dashed border-slate-400"></span>
            Dotted = projected (before portfolio creation)
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg width="24" height="2" className="inline-block">
            <line x1="0" y1="1" x2="24" y2="1" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
          Long dash = benchmarks
        </span>
      </div>
    </div>
  );
};
