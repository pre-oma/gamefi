'use client';

import React, { useState, useEffect } from 'react';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  portfolioCreatedDate: Date;
  maxDate?: Date;
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
}

type PresetKey = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'All' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  portfolioCreatedDate,
  maxDate = new Date(),
  startDate,
  endDate,
  onChange,
}) => {
  const [activePreset, setActivePreset] = useState<PresetKey | null>('ALL');
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Allow dates up to 2 years before portfolio creation for historical view
  const absoluteMinDate = subYears(portfolioCreatedDate, 2);

  // Initialize custom date inputs when dates change
  useEffect(() => {
    if (startDate) {
      setCustomStart(format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      setCustomEnd(format(endDate, 'yyyy-MM-dd'));
    }
  }, [startDate, endDate]);

  const handlePresetClick = (preset: PresetKey) => {
    setActivePreset(preset);
    setShowCustom(false);
    const today = endOfDay(maxDate);
    let start: Date;

    switch (preset) {
      case '1W':
        start = startOfDay(subDays(today, 7));
        break;
      case '1M':
        start = startOfDay(subMonths(today, 1));
        break;
      case '3M':
        start = startOfDay(subMonths(today, 3));
        break;
      case '6M':
        start = startOfDay(subMonths(today, 6));
        break;
      case '1Y':
        start = startOfDay(subYears(today, 1));
        break;
      case 'ALL':
      default:
        start = startOfDay(portfolioCreatedDate);
        break;
    }

    onChange(start, today);
  };

  const handleCustomStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomStart(value);
    setActivePreset(null);

    if (value) {
      const newStart = startOfDay(new Date(value));
      if (newStart <= maxDate) {
        onChange(newStart, endDate || maxDate);
      }
    }
  };

  const handleCustomEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomEnd(value);
    setActivePreset(null);

    if (value) {
      const newEnd = endOfDay(new Date(value));
      if (newEnd <= maxDate) {
        onChange(startDate || portfolioCreatedDate, newEnd);
      }
    }
  };

  const handleReset = () => {
    setActivePreset('ALL');
    setShowCustom(false);
    onChange(startOfDay(portfolioCreatedDate), endOfDay(maxDate));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preset Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Period:</span>
        <div className="flex items-center gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePresetClick(preset.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                activePreset === preset.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            showCustom || activePreset === null
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Range Inputs */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">From:</label>
            <input
              type="date"
              value={customStart}
              min={format(absoluteMinDate, 'yyyy-MM-dd')}
              max={format(maxDate, 'yyyy-MM-dd')}
              onChange={handleCustomStartChange}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">To:</label>
            <input
              type="date"
              value={customEnd}
              min={format(absoluteMinDate, 'yyyy-MM-dd')}
              max={format(maxDate, 'yyyy-MM-dd')}
              onChange={handleCustomEndChange}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Current Range Display */}
      {startDate && endDate && (
        <div className="text-xs text-slate-500">
          Showing: {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
        </div>
      )}
    </div>
  );
};
