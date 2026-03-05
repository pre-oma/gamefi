'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/components/ThemeProvider';
import { AppLayout, Button, PortfolioCard, Modal, Input } from '@/components';
import { Formation, FORMATIONS, PortfolioPerformance, TEAM_SLOT_UNLOCK_COST } from '@/types';
import {
  cn,
  formatCurrency,
  formatPercent,
  calculateLevel,
  calculatePortfolioPerformance,
  getLeaderboardEntries,
} from '@/lib/utils';
import { fetchMultiplePortfolioPerformances } from '@/hooks/usePortfolioRealPerformance';

export default function DashboardPage() {
  const { currentUser, portfolios, createPortfolio, canCreateTeam, getTeamSlotInfo, unlockTeamSlot } = useStore();
  const { resolvedTheme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-3');

  // State for real portfolio performances
  const [realPerformances, setRealPerformances] = useState<Map<string, { performance: PortfolioPerformance; isRealData: boolean }>>(new Map());
  const [loadingStats, setLoadingStats] = useState(false);

  // State for top performers with real data
  const [topPerformersData, setTopPerformersData] = useState<Map<string, { performance: PortfolioPerformance; isRealData: boolean }>>(new Map());
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false);

  // Fetch real performance data for all portfolios
  useEffect(() => {
    if (portfolios.length === 0) return;

    const fetchPerformances = async () => {
      setLoadingStats(true);
      try {
        const performances = await fetchMultiplePortfolioPerformances(portfolios, '1M');
        setRealPerformances(performances);
      } catch (error) {
        console.error('Failed to fetch portfolio performances:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchPerformances();
  }, [portfolios]);

  // Fetch real performance data for top performers (public portfolios)
  useEffect(() => {
    const baseEntries = getLeaderboardEntries('all', 5);
    if (baseEntries.length === 0) return;

    const fetchTopPerformers = async () => {
      setLoadingTopPerformers(true);
      try {
        // Get portfolio IDs from leaderboard entries
        const { portfolioStorage } = await import('@/lib/storage');
        const publicPortfolios = portfolioStorage.getPublic();
        const topPortfolios = publicPortfolios.filter(p =>
          baseEntries.some(e => e.portfolioId === p.id)
        );

        if (topPortfolios.length > 0) {
          const performances = await fetchMultiplePortfolioPerformances(topPortfolios, '1M');
          setTopPerformersData(performances);
        }
      } catch (error) {
        console.error('Failed to fetch top performers:', error);
      } finally {
        setLoadingTopPerformers(false);
      }
    };

    fetchTopPerformers();
  }, []);

  const portfolioStats = useMemo(() => {
    if (portfolios.length === 0) return null;

    // Use real performances if available, otherwise fall back to mock
    const performances = portfolios.map((p) => {
      const realData = realPerformances.get(p.id);
      return realData?.performance || calculatePortfolioPerformance(p);
    });

    const totalValue = performances.reduce((sum, p) => sum + p.totalValue, 0);
    const totalReturn = performances.reduce((sum, p) => sum + p.totalReturn, 0);
    const avgReturnPercent = performances.reduce((sum, p) => sum + p.totalReturnPercent, 0) / performances.length;

    return { totalValue, totalReturn, avgReturnPercent, count: portfolios.length, isLoading: loadingStats };
  }, [portfolios, realPerformances, loadingStats]);

  const topPerformers = useMemo(() => {
    const baseEntries = getLeaderboardEntries('all', 5);

    // Update entries with real performance data
    return baseEntries.map((entry) => {
      const realData = topPerformersData.get(entry.portfolioId);
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
  }, [topPerformersData]);
  const levelInfo = currentUser ? calculateLevel(currentUser.xp) : null;

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    if (!canCreateTeam()) return;

    try {
      const portfolio = await createPortfolio(newPortfolioName, newPortfolioDesc, selectedFormation);
      setShowCreateModal(false);
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      window.location.href = `/portfolio/${portfolio.id}`;
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  return (
    <AppLayout>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={cn(
            'text-3xl font-bold mb-2',
            resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
          )}>
            Welcome back, <span className="gradient-text">{currentUser?.displayName}</span>
          </h1>
          <p className={resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            Build your dream team and track your investment performance.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'} style={{fontSize: '0.875rem'}}>Total Value</span>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className={cn('text-2xl font-bold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>
              {portfolioStats ? formatCurrency(portfolioStats.totalValue) : '$0.00'}
            </p>
            {portfolioStats && (
              portfolioStats.isLoading ? (
                <div className={cn('h-5 w-24 animate-pulse rounded mt-1', resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-300')} />
              ) : (
                <p className={cn('text-sm mt-1', portfolioStats.avgReturnPercent >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {formatPercent(portfolioStats.avgReturnPercent)} avg return
                </p>
              )
            )}
          </div>

          <div className={cn(
            'rounded-2xl p-6 border',
            resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          )}>
            <div className="flex items-center justify-between mb-4">
              <span className={cn('text-sm', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Portfolios</span>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100')}>
                <svg className={cn('w-5 h-5', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className={cn('text-2xl font-bold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{portfolios.length}</p>
            <p className={cn('text-sm mt-1', resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>Active teams</p>
          </div>

          <div className={cn(
            'rounded-2xl p-6 border',
            resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          )}>
            <div className="flex items-center justify-between mb-4">
              <span className={cn('text-sm', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Level</span>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-yellow-100')}>
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className={cn('text-2xl font-bold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>Level {levelInfo?.level || 1}</p>
            {levelInfo && currentUser && (
              <div className="mt-2">
                <div className={cn('flex justify-between text-xs mb-1', resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>
                  <span>{currentUser.xp.toLocaleString()} XP</span>
                  {levelInfo.level < 5 ? (
                    <span>{(levelInfo.xpForCurrentLevel + levelInfo.nextLevelXp).toLocaleString()} XP</span>
                  ) : (
                    <span>Max Level</span>
                  )}
                </div>
                <div className={cn('w-full rounded-full h-1.5', resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')}>
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-1.5"
                    style={{ width: `${levelInfo.level >= 5 ? 100 : (levelInfo.currentXp / levelInfo.nextLevelXp) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={cn(
            'rounded-2xl p-6 border',
            resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          )}>
            <div className="flex items-center justify-between mb-4">
              <span className={cn('text-sm', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Community</span>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-blue-100')}>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className={cn('text-2xl font-bold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{currentUser?.followers.length || 0}</p>
            <p className={cn('text-sm mt-1', resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>Followers</p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Portfolios */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={cn('text-xl font-semibold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>My Teams</h2>
                <p className={cn('text-sm', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
                  {getTeamSlotInfo().current} / {getTeamSlotInfo().max} slots used
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!canCreateTeam() && (
                  <Button
                    onClick={async () => {
                      await unlockTeamSlot();
                    }}
                    size="sm"
                    variant="outline"
                    disabled={!getTeamSlotInfo().canUnlock}
                    title={getTeamSlotInfo().canUnlock ? `Spend ${TEAM_SLOT_UNLOCK_COST} XP to unlock` : `Need ${TEAM_SLOT_UNLOCK_COST} XP to unlock`}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock Slot ({TEAM_SLOT_UNLOCK_COST} XP)
                  </Button>
                )}
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  disabled={!canCreateTeam()}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Team
                </Button>
              </div>
            </div>

            {portfolios.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'border border-dashed rounded-2xl p-12 text-center',
                  resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-300'
                )}
              >
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                  resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                )}>
                  <svg className={cn('w-8 h-8', resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-400')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className={cn('text-lg font-semibold mb-2', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>No teams yet</h3>
                <p className={cn('mb-6', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Create your first investment team to start tracking performance.</p>
                <Button onClick={() => setShowCreateModal(true)} disabled={!canCreateTeam()}>Create Your First Team</Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolios.map((portfolio) => (
                  <PortfolioCard key={portfolio.id} portfolio={portfolio} showUser={false} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Performers */}
            <div className={cn(
              'rounded-2xl p-6 border',
              resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn('font-semibold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>Top Performers</h3>
                <Link href="/leaderboard" className="text-sm text-emerald-500 hover:text-emerald-400">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {topPerformers.length === 0 ? (
                  <p className="text-slate-500 text-sm">No performers yet</p>
                ) : (
                  topPerformers.map((entry) => (
                    <div key={entry.portfolioId} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          entry.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                          entry.rank === 2 ? 'bg-slate-400 text-slate-900' :
                          entry.rank === 3 ? 'bg-amber-600 text-white' :
                          resolvedTheme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {entry.rank}
                      </div>
                      <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>@{entry.username}</p>
                        <p className="text-xs text-slate-500 truncate">{entry.portfolioName}</p>
                      </div>
                      {loadingTopPerformers ? (
                        <div className={cn('w-12 h-4 animate-pulse rounded', resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')} />
                      ) : (
                        <span className={cn('text-sm font-semibold', entry.returnPercent >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                          {formatPercent(entry.returnPercent)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={cn(
              'rounded-2xl p-6 border',
              resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            )}>
              <h3 className={cn('font-semibold mb-4', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/explore"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    resolvedTheme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'
                  )}
                >
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className={resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Explore Portfolios</span>
                </Link>
                <Link
                  href="/market"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    resolvedTheme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'
                  )}
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className={resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>View Market</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    resolvedTheme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'
                  )}
                >
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className={resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Leaderboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

      {/* Create Portfolio Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Team" size="md">
        <div className="space-y-6">
          <Input
            label="Team Name"
            placeholder="e.g., Growth Champions"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
          />

          <Input
            label="Description (Optional)"
            placeholder="Describe your investment strategy..."
            value={newPortfolioDesc}
            onChange={(e) => setNewPortfolioDesc(e.target.value)}
          />

          <div>
            <label className={cn(
              'block text-sm font-medium mb-3',
              resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            )}>Select Formation</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
                <button
                  key={formation}
                  onClick={() => setSelectedFormation(formation)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                    selectedFormation === formation
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : resolvedTheme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  )}
                >
                  <span className={cn('text-lg font-bold', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{formation}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolio} className="flex-1" disabled={!newPortfolioName.trim() || !canCreateTeam()}>
              Create Team
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
