'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CustomDateRange } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface CustomDateRangeSelectorProps {
  dateRange: CustomDateRange | null;
  onDateRangeChange: (range: CustomDateRange | null) => void;
  disabled?: boolean;
}

export const CustomDateRangeSelector: React.FC<CustomDateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  disabled = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(dateRange?.startDate || '');
  const [endDate, setEndDate] = useState(dateRange?.endDate || '');

  const handleApply = () => {
    if (startDate && endDate) {
      onDateRangeChange({ startDate, endDate });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange(null);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          dateRange
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : resolvedTheme === 'dark'
              ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {dateRange ? (
          <span>{formatDisplayDate(dateRange.startDate)} - {formatDisplayDate(dateRange.endDate)}</span>
        ) : (
          <span>Custom Range</span>
        )}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'absolute top-full mt-2 right-0 z-50 rounded-xl p-4 shadow-xl min-w-[280px] border',
            resolvedTheme === 'dark'
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          )}
        >
          <div className="space-y-4">
            <div>
              <label className={cn('block text-xs mb-1', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 border',
                  resolvedTheme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-xs mb-1', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                max={new Date().toISOString().split('T')[0]}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 border',
                  resolvedTheme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                )}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-lg transition-colors border',
                  resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:text-white border-slate-700'
                    : 'text-slate-600 hover:text-slate-900 border-slate-200'
                )}
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                disabled={!startDate || !endDate}
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-lg transition-colors',
                  startDate && endDate
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : resolvedTheme === 'dark'
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                Apply
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
