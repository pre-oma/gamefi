'use client';

import React from 'react';
import { PortfolioPerformance } from '@/types';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

interface MetricConfig {
  key: keyof PortfolioPerformance;
  label: string;
  format: (value: number) => string;
  higherIsBetter: boolean;
}

const METRICS: MetricConfig[] = [
  { key: 'totalValue', label: 'Total Value', format: formatCurrency, higherIsBetter: true },
  { key: 'totalReturnPercent', label: 'Total Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'dayReturnPercent', label: 'Day Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'weekReturnPercent', label: 'Week Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'monthReturnPercent', label: 'Month Return', format: (v) => formatPercent(v), higherIsBetter: true },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', format: (v) => v.toFixed(2), higherIsBetter: true },
  { key: 'beta', label: 'Beta', format: (v) => v.toFixed(2), higherIsBetter: false },
  { key: 'volatility', label: 'Volatility', format: (v) => `${v.toFixed(2)}%`, higherIsBetter: false },
  { key: 'maxDrawdown', label: 'Max Drawdown', format: (v) => `${v.toFixed(2)}%`, higherIsBetter: false },
  { key: 'winRate', label: 'Win Rate', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true },
];

interface ComparisonTableProps {
  portfolioNames: string[];
  performances: PortfolioPerformance[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  portfolioNames,
  performances,
}) => {
  const findBestIndex = (metric: MetricConfig): number => {
    if (performances.length === 0) return -1;

    const values = performances.map((p) => Number(p[metric.key]) || 0);
    const bestValue = metric.higherIsBetter
      ? Math.max(...values)
      : Math.min(...values);

    return values.indexOf(bestValue);
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {METRICS.map((metric) => {
              const bestIndex = findBestIndex(metric);

              return (
                <tr key={metric.key} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-400">{metric.label}</td>
                  {performances.map((perf, index) => {
                    const value = Number(perf[metric.key]) || 0;
                    const isBest = index === bestIndex && performances.length > 1;

                    return (
                      <td
                        key={index}
                        className={cn(
                          'px-6 py-4 text-sm font-medium',
                          isBest ? 'text-emerald-400' : 'text-white'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {metric.format(value)}
                          {isBest && (
                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
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
