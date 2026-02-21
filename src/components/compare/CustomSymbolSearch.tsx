'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomComparisonSymbol } from '@/types';
import { cn } from '@/lib/utils';

interface CustomSymbolSearchProps {
  customSymbols: CustomComparisonSymbol[];
  onAddSymbol: (symbol: CustomComparisonSymbol) => void;
  onRemoveSymbol: (symbol: string) => void;
  maxSymbols?: number;
}

// Generate a color for custom symbols
const CUSTOM_COLORS = ['#ec4899', '#14b8a6', '#f97316', '#a855f7', '#22c55e', '#0ea5e9'];

export const CustomSymbolSearch: React.FC<CustomSymbolSearchProps> = ({
  customSymbols,
  onAddSymbol,
  onRemoveSymbol,
  maxSymbols = 5,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;

    const symbol = searchInput.trim().toUpperCase();

    // Check if already added
    if (customSymbols.some(s => s.symbol === symbol)) {
      setError('Symbol already added');
      return;
    }

    // Check max limit
    if (customSymbols.length >= maxSymbols) {
      setError(`Maximum ${maxSymbols} custom symbols allowed`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate symbol exists via Yahoo Finance API
      const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();

      if (!data.success || !data.asset) {
        setError('Symbol not found');
        setIsLoading(false);
        return;
      }

      // Add the symbol
      const colorIndex = customSymbols.length % CUSTOM_COLORS.length;
      onAddSymbol({
        symbol: data.asset.symbol,
        name: data.asset.name,
        color: CUSTOM_COLORS[colorIndex],
      });

      setSearchInput('');
    } catch (err) {
      setError('Failed to validate symbol');
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, customSymbols, maxSymbols, onAddSymbol]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400">Add Custom Symbol</h3>
        <span className="text-xs text-slate-500">
          {customSymbols.length}/{maxSymbols} added
        </span>
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter symbol (e.g., AAPL, MSFT)"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            disabled={isLoading || customSymbols.length >= maxSymbols}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchInput.trim() || customSymbols.length >= maxSymbols}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            isLoading || !searchInput.trim() || customSymbols.length >= maxSymbols
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          )}
        >
          Add
        </button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 mb-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Added symbols */}
      {customSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSymbols.map((symbol) => (
            <motion.div
              key={symbol.symbol}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{
                backgroundColor: `${symbol.color}20`,
                border: `1px solid ${symbol.color}50`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: symbol.color }}
              />
              <span className="text-white font-medium">{symbol.symbol}</span>
              <span className="text-slate-400 text-xs hidden sm:inline">
                {symbol.name.length > 20 ? symbol.name.slice(0, 20) + '...' : symbol.name}
              </span>
              <button
                onClick={() => onRemoveSymbol(symbol.symbol)}
                className="ml-1 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        Compare your portfolio against any stock, ETF, or index
      </p>
    </div>
  );
};
