'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Header, Button } from '@/components';
import { ChallengeCard, CreateChallengeModal, ChallengeResultCard, ChallengeLeaderboard } from '@/components/challenge';
import { MAX_ACTIVE_CHALLENGES, CHALLENGE_XP } from '@/types';
import { cn } from '@/lib/utils';

export default function ChallengesPage() {
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    loadData,
    challenges,
    pendingChallenges,
    activeChallenges,
    completedChallenges,
    challengesLoading,
    loadChallenges,
    getActiveChallengesCount,
  } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'history' | 'leaderboard'>('active');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChallenges();
    }
  }, [isAuthenticated, loadChallenges]);

  const stats = useMemo(() => {
    const totalChallenges = challenges.length;
    const wins = completedChallenges.filter(
      (c) => c.winnerId === currentUser?.id
    ).length;
    const losses = completedChallenges.filter(
      (c) => c.winnerId !== null && c.winnerId !== currentUser?.id && c.winnerId !== 'sp500'
    ).length;
    // Include S&P 500 wins/losses
    const sp500Wins = completedChallenges.filter(
      (c) => c.type === 'sp500' && c.winnerId === currentUser?.id
    ).length;
    const sp500Losses = completedChallenges.filter(
      (c) => c.type === 'sp500' && c.winnerId === 'sp500'
    ).length;

    const totalWins = wins + sp500Wins;
    const totalLosses = losses + sp500Losses;
    const winRate = totalChallenges > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;

    return {
      active: getActiveChallengesCount(),
      pending: pendingChallenges.length,
      total: totalChallenges,
      wins: totalWins,
      losses: totalLosses,
      winRate: isNaN(winRate) ? 0 : winRate,
    };
  }, [challenges, completedChallenges, pendingChallenges, currentUser, getActiveChallengesCount]);

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
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <span className="gradient-text">Challenges</span>
              </h1>
              <p className="text-slate-400">
                Compete against the S&P 500 or other players to earn XP
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Challenge
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Active</span>
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.active}/{MAX_ACTIVE_CHALLENGES}
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Pending</span>
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Win Rate</span>
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(0)}%</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Record</span>
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              <span className="text-emerald-400">{stats.wins}W</span>
              {' - '}
              <span className="text-red-400">{stats.losses}L</span>
            </p>
          </div>
        </motion.div>

        {/* XP Stakes Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-slate-400">vs S&P 500:</span>
              <span className="text-amber-400 font-semibold">{CHALLENGE_XP.VS_SP500} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <span className="text-slate-400">vs User:</span>
              <span className="text-purple-400 font-semibold">{CHALLENGE_XP.VS_USER} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Max active:</span>
              <span className="text-white font-semibold">{MAX_ACTIVE_CHALLENGES}</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'active'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              Active ({activeChallenges.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'pending'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              Pending ({pendingChallenges.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'history'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              History ({completedChallenges.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'leaderboard'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              Leaderboard
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {challengesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Active Challenges */}
              {activeTab === 'active' && (
                <div>
                  {activeChallenges.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No active challenges</h3>
                      <p className="text-slate-400 mb-6">Start a new challenge to compete!</p>
                      <Button onClick={() => setShowCreateModal(true)}>Create Challenge</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pending Challenges */}
              {activeTab === 'pending' && (
                <div>
                  {pendingChallenges.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No pending invites</h3>
                      <p className="text-slate-400">Challenge invites from other users will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Challenge History */}
              {activeTab === 'history' && (
                <div>
                  {completedChallenges.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No challenge history</h3>
                      <p className="text-slate-400">Completed challenges will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedChallenges.map((challenge) => (
                        <ChallengeResultCard key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard */}
              {activeTab === 'leaderboard' && (
                <ChallengeLeaderboard limit={20} />
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
