'use client';

import React from 'react';
import Link from 'next/link';
import { Portfolio, User, PortfolioPerformance } from '@/types';
import { FormationField } from '@/components/portfolio/FormationField';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface ComparisonCardProps {
  portfolio: Portfolio;
  owner: User | null;
  performance: PortfolioPerformance;
  onRemove: () => void;
  colorIndex: number;
}

const COLORS = ['emerald', 'blue', 'purple', 'amber'];

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  portfolio,
  owner,
  performance,
  onRemove,
  colorIndex,
}) => {
  const { resolvedTheme } = useTheme();
  const color = COLORS[colorIndex % COLORS.length];
  const filledPositions = portfolio.players.filter((p) => p.asset !== null).length;

  const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    blue: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-500' },
    purple: { border: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-500' },
    amber: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-500' },
  };

  const classes = colorClasses[color];

  return (
    <div className={cn(
      'border-2 rounded-xl overflow-hidden',
      resolvedTheme === 'dark' ? 'bg-slate-900/80' : 'bg-white shadow-sm',
      classes.border
    )}>
      {/* Header */}
      <div className={cn('px-4 py-3 flex items-center justify-between', classes.bg)}>
        <div className="min-w-0">
          <Link
            href={`/portfolio/${portfolio.id}`}
            className={cn('font-semibold text-sm hover:underline', classes.text)}
          >
            {portfolio.name}
          </Link>
          {owner && (
            <p className={cn('text-xs truncate', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>@{owner.username}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mini Formation */}
      <div className="p-4">
        <div className="w-full max-w-[120px] mx-auto">
          <FormationField portfolio={portfolio} compact />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-center">
        <div className={cn('rounded-lg p-2', resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100')}>
          <p className="text-xs text-slate-500">Value</p>
          <p className={cn('text-sm font-semibold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{formatCurrency(performance.totalValue)}</p>
        </div>
        <div className={cn('rounded-lg p-2', resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100')}>
          <p className="text-xs text-slate-500">Return</p>
          <p className={cn(
            'text-sm font-semibold',
            performance.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {formatPercent(performance.totalReturnPercent)}
          </p>
        </div>
        <div className={cn('rounded-lg p-2', resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100')}>
          <p className="text-xs text-slate-500">Formation</p>
          <p className={cn('text-sm font-medium', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{portfolio.formation}</p>
        </div>
        <div className={cn('rounded-lg p-2', resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100')}>
          <p className="text-xs text-slate-500">Players</p>
          <p className={cn('text-sm font-medium', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{filledPositions}/11</p>
        </div>
      </div>
    </div>
  );
};
