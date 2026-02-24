'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Header, Button, PortfolioCard, Modal, Input } from '@/components';
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
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading, loadData, portfolios, createPortfolio, canCreateTeam, getTeamSlotInfo, unlockTeamSlot } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-3');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

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

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    if (!canCreateTeam()) return;

    try {
      const portfolio = createPortfolio(newPortfolioName, newPortfolioDesc, selectedFormation);
      setShowCreateModal(false);
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      router.push(`/portfolio/${portfolio.id}`);
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{currentUser?.displayName}</span>
          </h1>
          <p className="text-slate-400">Build your dream team and track your investment performance.</p>
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
              <span className="text-slate-400 text-sm">Total Value</span>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {portfolioStats ? formatCurrency(portfolioStats.totalValue) : '$0.00'}
            </p>
            {portfolioStats && (
              portfolioStats.isLoading ? (
                <div className="h-5 w-24 bg-slate-700 animate-pulse rounded mt-1" />
              ) : (
                <p className={cn('text-sm mt-1', portfolioStats.avgReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {formatPercent(portfolioStats.avgReturnPercent)} avg return
                </p>
              )
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">Portfolios</span>
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{portfolios.length}</p>
            <p className="text-sm text-slate-500 mt-1">Active teams</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">Level</span>
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">Level {levelInfo?.level || 1}</p>
            {levelInfo && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{levelInfo.currentXp} XP</span>
                  <span>{levelInfo.nextLevelXp} XP</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-1.5"
                    style={{ width: `${(levelInfo.currentXp / levelInfo.nextLevelXp) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">Community</span>
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{currentUser?.followers.length || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Followers</p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Portfolios */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">My Teams</h2>
                <p className="text-sm text-slate-400">
                  {getTeamSlotInfo().current} / {getTeamSlotInfo().max} slots used
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!canCreateTeam() && (
                  <Button
                    onClick={() => {
                      if (unlockTeamSlot()) {
                        // Successfully unlocked
                      }
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
                className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No teams yet</h3>
                <p className="text-slate-400 mb-6">Create your first investment team to start tracking performance.</p>
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
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Top Performers</h3>
                <Link href="/leaderboard" className="text-sm text-emerald-400 hover:text-emerald-300">
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
                          'bg-slate-700 text-slate-300'
                        )}
                      >
                        {entry.rank}
                      </div>
                      <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">@{entry.username}</p>
                        <p className="text-xs text-slate-500 truncate">{entry.portfolioName}</p>
                      </div>
                      {loadingTopPerformers ? (
                        <div className="w-12 h-4 bg-slate-700 animate-pulse rounded" />
                      ) : (
                        <span className={cn('text-sm font-semibold', entry.returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {formatPercent(entry.returnPercent)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/explore"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-slate-300">Explore Portfolios</span>
                </Link>
                <Link
                  href="/market"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-slate-300">View Market</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-slate-300">Leaderboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

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
            <label className="block text-sm font-medium text-slate-300 mb-3">Select Formation</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
                <button
                  key={formation}
                  onClick={() => setSelectedFormation(formation)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                    selectedFormation === formation
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <span className="text-lg font-bold text-white">{formation}</span>
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
    </div>
  );
}
