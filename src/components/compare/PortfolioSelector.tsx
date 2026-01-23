'use client';

import React, { useMemo } from 'react';
import { Portfolio, User } from '@/types';
import { cn } from '@/lib/utils';

interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  publicPortfolios: Portfolio[];
  currentUserId: string;
  selectedPortfolioIds: string[];
  onSelect: (portfolioId: string) => void;
  users: Map<string, User>;
  index: number;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  portfolios,
  publicPortfolios,
  currentUserId,
  selectedPortfolioIds,
  onSelect,
  users,
  index,
}) => {
  const currentSelection = selectedPortfolioIds[index] || '';

  // Filter out already selected portfolios (except current selection)
  const availablePortfolios = useMemo(() => {
    const otherSelections = selectedPortfolioIds.filter((_, i) => i !== index);
    return portfolios.filter((p) => !otherSelections.includes(p.id));
  }, [portfolios, selectedPortfolioIds, index]);

  const availablePublicPortfolios = useMemo(() => {
    const otherSelections = selectedPortfolioIds.filter((_, i) => i !== index);
    // Filter out user's own portfolios and already selected ones
    return publicPortfolios.filter(
      (p) => p.userId !== currentUserId && !otherSelections.includes(p.id)
    );
  }, [publicPortfolios, currentUserId, selectedPortfolioIds, index]);

  const getUsername = (userId: string): string => {
    return users.get(userId)?.username || 'Unknown';
  };

  return (
    <div className="relative">
      <select
        value={currentSelection}
        onChange={(e) => onSelect(e.target.value)}
        className={cn(
          'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white',
          'focus:outline-none focus:border-emerald-500 transition-colors',
          'appearance-none cursor-pointer',
          !currentSelection && 'text-slate-400'
        )}
      >
        <option value="">Select Portfolio {index + 1}</option>

        {availablePortfolios.length > 0 && (
          <optgroup label="My Portfolios">
            {availablePortfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name} ({portfolio.formation})
              </option>
            ))}
          </optgroup>
        )}

        {availablePublicPortfolios.length > 0 && (
          <optgroup label="Public Portfolios">
            {availablePublicPortfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name} by @{getUsername(portfolio.userId)} ({portfolio.formation})
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};
