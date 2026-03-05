'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioTemplate, FORMATIONS, RiskLevel } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui';

interface TemplateDetailModalProps {
  template: PortfolioTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (templateId: string) => void;
  isCreating: boolean;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const DIFFICULTY_COLORS = {
  beginner: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  intermediate: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  advanced: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  isCreating,
}) => {
  const { resolvedTheme } = useTheme();

  if (!template) return null;

  const positions = FORMATIONS[template.formation];

  // Group stocks by position row for display
  const getPositionName = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    return position?.name || positionId;
  };

  const getPositionShortName = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    return position?.shortName || positionId.toUpperCase();
  };

  const getPositionRow = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    return position?.row ?? 0;
  };

  const groupedStocks = template.stocks.reduce((acc, stock) => {
    const row = getPositionRow(stock.positionId);
    if (!acc[row]) acc[row] = [];
    acc[row].push(stock);
    return acc;
  }, {} as Record<number, typeof template.stocks>);

  const rowLabels: Record<number, string> = {
    0: 'Goalkeeper (Low Risk)',
    1: 'Defense (Low Risk)',
    2: 'Midfield (Medium Risk)',
    3: 'Attack (High Risk)',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border',
              resolvedTheme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200'
            )}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 p-2 rounded-lg transition-colors z-10',
                resolvedTheme === 'dark'
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className={cn('p-6 border-b', resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className={cn('text-2xl font-bold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>
                      {template.name}
                    </h2>
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      resolvedTheme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    )}>
                      {template.formation}
                    </span>
                  </div>
                  <p className={cn('mb-4', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
                    {template.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      RISK_COLORS[template.expectedRisk].bg,
                      RISK_COLORS[template.expectedRisk].text
                    )}>
                      {template.expectedRisk.charAt(0).toUpperCase() + template.expectedRisk.slice(1)} Risk
                    </span>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      DIFFICULTY_COLORS[template.difficulty].bg,
                      DIFFICULTY_COLORS[template.difficulty].text
                    )}>
                      {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                    </span>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium capitalize',
                      resolvedTheme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    )}>
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formation Preview */}
            <div className={cn('p-6 border-b', resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
              <h3 className={cn('text-lg font-semibold mb-4', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>
                Team Lineup
              </h3>

              <div className="space-y-4">
                {[3, 2, 1, 0].map(row => (
                  groupedStocks[row] && (
                    <div key={row}>
                      <p className={cn('text-xs font-medium mb-2', resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                        {rowLabels[row]}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {groupedStocks[row].map(stock => (
                          <div
                            key={stock.positionId}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border',
                              resolvedTheme === 'dark'
                                ? 'bg-slate-800/50 border-slate-700'
                                : 'bg-slate-50 border-slate-200'
                            )}
                          >
                            <span className={cn(
                              'text-xs font-medium px-1.5 py-0.5 rounded',
                              resolvedTheme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                            )}>
                              {getPositionShortName(stock.positionId)}
                            </span>
                            <span className={cn(
                              'font-semibold',
                              resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
                            )}>
                              {stock.symbol}
                            </span>
                            <span className={cn(
                              'text-xs',
                              resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            )}>
                              {stock.allocation.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className={cn('px-6 py-4 border-b', resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
              <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6">
              <div className="flex gap-3">
                <Button
                  onClick={() => onUseTemplate(template.id)}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Portfolio...
                    </span>
                  ) : (
                    'Use This Template'
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className={cn(
                    resolvedTheme === 'dark'
                      ? 'border-slate-700 text-slate-400 hover:text-white'
                      : 'border-slate-300 text-slate-600 hover:text-slate-900'
                  )}
                >
                  Cancel
                </Button>
              </div>
              <p className={cn(
                'text-xs text-center mt-4',
                resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              )}>
                This will create a new portfolio pre-filled with these stocks
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
