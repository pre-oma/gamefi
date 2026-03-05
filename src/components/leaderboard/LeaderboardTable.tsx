'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PortfolioPerformance, Portfolio, LeaderboardEntry } from '@/types';
import { cn, formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { fetchMultiplePortfolioPerformances } from '@/hooks/usePortfolioRealPerformance';
import { useTheme } from '@/components/ThemeProvider';

export const LeaderboardTable: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { publicPortfolios, portfolios, currentUser, refreshPortfolios } = useStore();
  const [realPerformances, setRealPerformances] = useState<Map<string, { performance: PortfolioPerformance; isRealData: boolean }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [usernames, setUsernames] = useState<Map<string, { username: string; avatar: string }>>(new Map());

  // Combine public portfolios with current user's portfolios (avoiding duplicates)
  const allPortfolios = useMemo(() => {
    const portfolioMap = new Map<string, Portfolio>();

    // Add public portfolios
    publicPortfolios.forEach(p => portfolioMap.set(p.id, p));

    // Add current user's portfolios (they might not be in public yet or might be private)
    portfolios.forEach(p => {
      if (p.isPublic) {
        portfolioMap.set(p.id, p);
      }
    });

    return Array.from(portfolioMap.values());
  }, [publicPortfolios, portfolios]);

  // Refresh portfolios on mount
  useEffect(() => {
    refreshPortfolios();
  }, [refreshPortfolios]);

  // Fetch usernames for all portfolio owners
  useEffect(() => {
    const fetchUsernames = async () => {
      const userIds = [...new Set(allPortfolios.map(p => p.userId))];
      const newUsernames = new Map<string, { username: string; avatar: string }>();

      for (const userId of userIds) {
        // Check if it's the current user
        if (currentUser && userId === currentUser.id) {
          newUsernames.set(userId, {
            username: currentUser.username,
            avatar: currentUser.avatar || '/default-avatar.png'
          });
          continue;
        }

        // Fetch from API
        try {
          const response = await fetch(`/api/users?id=${userId}`);
          const data = await response.json();
          if (data.success && data.user) {
            newUsernames.set(userId, {
              username: data.user.username,
              avatar: data.user.avatar || '/default-avatar.png'
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
          newUsernames.set(userId, { username: 'Unknown', avatar: '/default-avatar.png' });
        }
      }

      setUsernames(newUsernames);
    };

    if (allPortfolios.length > 0) {
      fetchUsernames();
    }
  }, [allPortfolios, currentUser]);

  // Fetch real performance data (always from creation date)
  useEffect(() => {
    if (allPortfolios.length === 0) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Always use creation date for calculating returns
        const performances = await fetchMultiplePortfolioPerformances(allPortfolios, '1M', true);
        setRealPerformances(performances);
      } catch (error) {
        console.error('Failed to fetch leaderboard performances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [allPortfolios]);

  // Build leaderboard entries from portfolios
  const entries = useMemo(() => {
    const leaderboardEntries: LeaderboardEntry[] = allPortfolios.map((portfolio) => {
      const userData = usernames.get(portfolio.userId);
      const realData = realPerformances.get(portfolio.id);

      return {
        rank: 0,
        userId: portfolio.userId,
        username: userData?.username || 'Loading...',
        avatar: userData?.avatar || '/default-avatar.png',
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        formation: portfolio.formation,
        value: realData?.performance.totalValue || 10000,
        returnPercent: realData?.performance.totalReturnPercent || 0,
        followers: 0,
        createdAt: portfolio.createdAt,
      };
    });

    // Sort by return and assign ranks
    return leaderboardEntries
      .sort((a, b) => b.returnPercent - a.returnPercent)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))
      .slice(0, 20);
  }, [allPortfolios, usernames, realPerformances]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-500', text: 'text-yellow-900', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-slate-400', text: 'text-slate-900', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', icon: '🥉' };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className={cn(
        'rounded-2xl overflow-hidden border',
        resolvedTheme === 'dark'
          ? 'bg-slate-900/80 border-slate-800'
          : 'bg-white border-slate-200 shadow-sm'
      )}>
        {/* Header */}
        <div className={cn(
          'grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wider',
          resolvedTheme === 'dark' ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'
        )}>
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Investor</div>
          <div className="col-span-2">Portfolio</div>
          <div className="col-span-2 text-center">Created</div>
          <div className="col-span-1 text-right">Value</div>
          <div className="col-span-2 text-right">Return</div>
        </div>

        {/* Rows */}
        <div className={cn('divide-y', resolvedTheme === 'dark' ? 'divide-slate-800' : 'divide-slate-200')}>
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
                  className={cn(
                    'grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors',
                    resolvedTheme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                  )}
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
                      className={cn(
                        'w-10 h-10 rounded-full ring-2',
                        resolvedTheme === 'dark' ? 'ring-slate-700' : 'ring-slate-200'
                      )}
                    />
                    <div className="min-w-0">
                      <p className={cn('font-medium truncate', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>@{entry.username}</p>
                      <p className="text-sm text-slate-500">{entry.followers} followers</p>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="col-span-2 min-w-0">
                    <Link
                      href={`/portfolio/${entry.portfolioId}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      <p className={cn('font-medium truncate', resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>{entry.portfolioName}</p>
                      <p className="text-xs text-slate-500">{entry.formation}</p>
                    </Link>
                  </div>

                  {/* Created */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-slate-400">{formatDate(entry.createdAt)}</span>
                  </div>

                  {/* Value */}
                  <div className="col-span-1 text-right">
                    <span className={cn('font-medium', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{formatCurrency(entry.value)}</span>
                  </div>

                  {/* Return (since creation) */}
                  <div className="col-span-2 text-right">
                    {isLoading ? (
                      <div className={cn('w-16 h-6 animate-pulse rounded ml-auto', resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')} />
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
