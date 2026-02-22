'use client';

import React from 'react';
import { PortfolioPerformance, BenchmarkPerformance } from '@/types';
import { cn, formatCurrency, formatPercent, formatPE, formatEPS, formatPercentMetric, formatRatio } from '@/lib/utils';

interface MetricConfig {
  key: keyof PortfolioPerformance;
  label: string;
  format: (value: number) => string;
  higherIsBetter: boolean;
  benchmarkKey?: keyof BenchmarkPerformance;
}

const METRICS: MetricConfig[] = [
  { key: 'totalValue', label: 'Total Value', format: formatCurrency, higherIsBetter: true, benchmarkKey: 'totalValue' },
  { key: 'totalReturnPercent', label: 'Total Return', format: (v) => formatPercent(v), higherIsBetter: true, benchmarkKey: 'totalReturnPercent' },
  { key: 'alpha', label: 'Alpha', format: (v) => v !== null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : 'N/A', higherIsBetter: true },
  { key: 'dayReturnPercent', label: 'Day Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'weekReturnPercent', label: 'Week Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'monthReturnPercent', label: 'Month Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', format: (v) => v.toFixed(2), higherIsBetter: true, benchmarkKey: 'sharpeRatio' },
  { key: 'beta', label: 'Beta', format: (v) => v.toFixed(2), higherIsBetter: false, benchmarkKey: 'beta' },
  { key: 'volatility', label: 'Volatility', format: (v) => `${v.toFixed(2)}%`, higherIsBetter: false, benchmarkKey: 'volatility' },
  { key: 'maxDrawdown', label: 'Max Drawdown', format: (v) => `${v.toFixed(2)}%`, higherIsBetter: false, benchmarkKey: 'maxDrawdown' },
  { key: 'winRate', label: 'Win Rate', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true, benchmarkKey: 'winRate' },
  { key: 'weightedPE', label: 'Avg P/E', format: (v) => v !== null ? formatPE(v) : 'N/A', higherIsBetter: false },
  { key: 'weightedEPS', label: 'Avg EPS', format: (v) => v !== null ? formatEPS(v) : 'N/A', higherIsBetter: true },
  { key: 'weightedROE', label: 'Avg ROE', format: (v) => v !== null ? formatPercentMetric(v) : 'N/A', higherIsBetter: true },
  { key: 'weightedProfitMargin', label: 'Avg Margin', format: (v) => v !== null ? formatPercentMetric(v) : 'N/A', higherIsBetter: true },
  { key: 'weightedDebtToEquity', label: 'Avg D/E', format: (v) => v !== null ? formatRatio(v) : 'N/A', higherIsBetter: false },
];

interface ComparisonTableProps {
  portfolioNames: string[];
  performances: PortfolioPerformance[];
  benchmarks?: BenchmarkPerformance[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  portfolioNames,
  performances,
  benchmarks = [],
}) => {
  const findBestIndex = (metric: MetricConfig): number => {
    if (performances.length === 0) return -1;

    // Get values, filtering out null/undefined for comparison
    const values = performances.map((p) => {
      const v = p[metric.key];
      return v === null || v === undefined ? null : (typeof v === 'number' ? v : Number(v));
    });

    // Filter to only valid numbers for finding best
    const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
    if (validValues.length === 0) return -1;

    const bestValue = metric.higherIsBetter
      ? Math.max(...validValues)
      : Math.min(...validValues);

    return values.indexOf(bestValue);
  };

  const getBenchmarkValue = (benchmark: BenchmarkPerformance, metric: MetricConfig): number | null => {
    if (!metric.benchmarkKey) return null;
    const value = benchmark[metric.benchmarkKey];
    return typeof value === 'number' ? value : null;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Detailed Comparison</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Metric
              </th>
              {portfolioNames.map((name, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {name}
                </th>
              ))}
              {benchmarks.map((benchmark) => (
                <th
                  key={benchmark.symbol}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: benchmark.color }}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: benchmark.color }}
                    />
                    {benchmark.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {METRICS.map((metric) => {
              const bestIndex = findBestIndex(metric);

              return (
                <tr key={metric.key} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-400">{metric.label}</td>
                  {performances.map((perf, index) => {
                    const rawValue = perf[metric.key];
                    // Preserve null/undefined for metrics that use N/A formatting
                    const value = rawValue === null || rawValue === undefined
                      ? null
                      : (typeof rawValue === 'number' ? rawValue : Number(rawValue) || 0);
                    const isBest = index === bestIndex && performances.length > 1 && value !== null;

                    return (
                      <td
                        key={index}
                        className={cn(
                          'px-6 py-4 text-sm font-medium',
                          isBest ? 'text-emerald-400' : 'text-white'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {metric.format(value as number)}
                          {isBest && (
                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {/* Benchmark columns */}
                  {benchmarks.map((benchmark) => {
                    const value = getBenchmarkValue(benchmark, metric);
                    return (
                      <td
                        key={benchmark.symbol}
                        className="px-6 py-4 text-sm font-medium"
                        style={{ color: value !== null ? benchmark.color : '#475569' }}
                      >
                        {value !== null ? metric.format(value) : '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
