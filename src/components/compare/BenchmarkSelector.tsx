'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BenchmarkSymbol, BenchmarkInfo, BENCHMARKS } from '@/types';
import { cn } from '@/lib/utils';

interface BenchmarkSelectorProps {
  selectedBenchmarks: BenchmarkSymbol[];
  onToggle: (symbol: BenchmarkSymbol) => void;
  maxSelections?: number;
}

export const BenchmarkSelector: React.FC<BenchmarkSelectorProps> = ({
  selectedBenchmarks,
  onToggle,
  maxSelections = 3,
}) => {
  const isSelected = (symbol: BenchmarkSymbol) => selectedBenchmarks.includes(symbol);
  const canSelect = selectedBenchmarks.length < maxSelections;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400">Compare with Benchmarks</h3>
        <span className="text-xs text-slate-500">
          {selectedBenchmarks.length}/{maxSelections} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {BENCHMARKS.map((benchmark: BenchmarkInfo) => {
          const selected = isSelected(benchmark.symbol);
          const disabled = !selected && !canSelect;

          return (
            <motion.button
              key={benchmark.symbol}
              onClick={() => !disabled && onToggle(benchmark.symbol)}
              whileHover={!disabled ? { scale: 1.02 } : undefined}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
              className={cn(
                'relative px-3 py-2 rounded-lg text-sm font-medium transition-all',
                'border flex items-center gap-2',
                selected
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : disabled
                    ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              )}
              disabled={disabled}
              title={benchmark.description}
            >
              {/* Color indicator */}
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  selected ? 'opacity-100' : 'opacity-50'
                )}
                style={{ backgroundColor: benchmark.color }}
              />

              <span>{benchmark.name}</span>

              {/* Checkmark for selected */}
              {selected && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedBenchmarks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap gap-1">
            {selectedBenchmarks.map((symbol) => {
              const benchmark = BENCHMARKS.find((b) => b.symbol === symbol);
              return benchmark ? (
                <span
                  key={symbol}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: `${benchmark.color}20`,
                    color: benchmark.color,
                  }}
                >
                  {benchmark.symbol}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};
