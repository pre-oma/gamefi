'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PortfolioPerformance } from '@/types';
import { getLeaderboardEntries, cn, formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { portfolioStorage } from '@/lib/storage';
import { fetchMultiplePortfolioPerformances } from '@/hooks/usePortfolioRealPerformance';

export const LeaderboardTable: React.FC = () => {
  const [realPerformances, setRealPerformances] = useState<Map<string, { performance: PortfolioPerformance; isRealData: boolean }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real performance data (always from creation date)
  useEffect(() => {
    const publicPortfolios = portfolioStorage.getPublic();
    if (publicPortfolios.length === 0) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Always use creation date for calculating returns
        const performances = await fetchMultiplePortfolioPerformances(publicPortfolios, '1M', true);
        setRealPerformances(performances);
      } catch (error) {
        console.error('Failed to fetch leaderboard performances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get entries with real performance data (calculated from creation date)
  const entries = useMemo(() => {
    const baseEntries = getLeaderboardEntries('all', 20);

    // Update entries with real performance data
    return baseEntries.map((entry) => {
      const realData = realPerformances.get(entry.portfolioId);
      if (realData?.isRealData) {
        return {
          ...entry,
          value: realData.performance.totalValue,
          returnPercent: realData.performance.totalReturnPercent,
        };
      }
      return entry;
    }).sort((a, b) => b.returnPercent - a.returnPercent).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [realPerformances]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-500', text: 'text-yellow-900', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-slate-400', text: 'text-slate-900', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', icon: '🥉' };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Investor</div>
          <div className="col-span-2">Portfolio</div>
          <div className="col-span-2 text-center">Created</div>
          <div className="col-span-1 text-right">Value</div>
          <div className="col-span-2 text-right">Return</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No portfolios to rank yet</p>
              <p className="text-sm mt-1">Create a portfolio to join the leaderboard!</p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const badge = getRankBadge(entry.rank);

              return (
                <motion.div
                  key={`${entry.portfolioId}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-800/30 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    {badge ? (
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-lg',
                          badge.bg,
                          badge.text
                        )}
                      >
                        {badge.icon}
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-slate-500">{entry.rank}</span>
                    )}
                  </div>

                  {/* Investor */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <img
                      src={entry.avatar}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full ring-2 ring-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">@{entry.username}</p>
                      <p className="text-sm text-slate-500">{entry.followers} followers</p>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="col-span-2 min-w-0">
                    <Link
                      href={`/portfolio/${entry.portfolioId}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      <p className="font-medium text-slate-300 truncate">{entry.portfolioName}</p>
                      <p className="text-xs text-slate-500">{entry.formation}</p>
                    </Link>
                  </div>

                  {/* Created */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-slate-400">{formatDate(entry.createdAt)}</span>
                  </div>

                  {/* Value */}
                  <div className="col-span-1 text-right">
                    <span className="font-medium text-white">{formatCurrency(entry.value)}</span>
                  </div>

                  {/* Return (since creation) */}
                  <div className="col-span-2 text-right">
                    {isLoading ? (
                      <div className="w-16 h-6 bg-slate-700 animate-pulse rounded ml-auto" />
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-bold text-lg',
                          entry.returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {entry.returnPercent >= 0 ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {formatPercent(entry.returnPercent, false)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
