'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ComparisonTimeframe, COMPARISON_TIMEFRAMES } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface TimeframeSelectorProps {
  selectedTimeframe: ComparisonTimeframe;
  onSelect: (timeframe: ComparisonTimeframe) => void;
  disabled?: boolean;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onSelect,
  disabled = false,
}) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn(
      'flex items-center gap-1 p-1 rounded-lg border',
      resolvedTheme === 'dark'
        ? 'bg-slate-900/50 border-slate-800'
        : 'bg-slate-100 border-slate-200'
    )}>
      {COMPARISON_TIMEFRAMES.map(({ value, label }) => {
        const isSelected = selectedTimeframe === value;

        return (
          <button
            key={value}
            onClick={() => !disabled && onSelect(value)}
            disabled={disabled}
            className={cn(
              'relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              disabled && 'opacity-50 cursor-not-allowed',
              isSelected
                ? resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
                : resolvedTheme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="timeframe-indicator"
                className={cn(
                  'absolute inset-0 rounded-md',
                  resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm'
                )}
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
