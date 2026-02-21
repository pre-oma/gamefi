'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ComparisonTimeframe, COMPARISON_TIMEFRAMES } from '@/types';
import { cn } from '@/lib/utils';

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
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-slate-800 rounded-lg">
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
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="timeframe-indicator"
                className="absolute inset-0 bg-slate-700 rounded-md"
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
