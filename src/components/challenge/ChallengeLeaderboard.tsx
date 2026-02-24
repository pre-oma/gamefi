'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  wins: number;
  losses: number;
  draws: number;
  totalChallenges: number;
  winRate: number;
  xpEarned: number;
  sp500Wins: number;
  userWins: number;
}

interface ChallengeLeaderboardProps {
  limit?: number;
  type?: 'all' | 'sp500' | 'user';
  compact?: boolean;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  limit = 10,
  type = 'all',
  compact = false,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeType, setActiveType] = useState(type);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/challenges/leaderboard?limit=${limit}&type=${activeType}`
        );
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit, activeType]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-slate-700">2</span>
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">3</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-slate-400">{rank}</span>
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Top Challengers
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-700 rounded-full" />
                <div className="flex-1 h-4 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No challengers yet</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3">
                {getRankBadge(entry.rank)}
                <img
                  src={entry.avatar || '/default-avatar.png'}
                  alt={entry.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">@{entry.username}</p>
                  <p className="text-xs text-slate-500">
                    {entry.wins}W - {entry.losses}L
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">
                  {entry.winRate.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Challenge Leaderboard
          </h2>

          {/* Type Filter */}
          <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
            {(['all', 'sp500', 'user'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  activeType === t
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {t === 'all' ? 'All' : t === 'sp500' ? 'vs S&P' : 'vs User'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No challengers yet</h3>
            <p className="text-slate-400">Be the first to complete a challenge!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Record
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                  XP Earned
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Breakdown
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaderboard.map((entry, index) => (
                <motion.tr
                  key={entry.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRankBadge(entry.rank)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.avatar || '/default-avatar.png'}
                        alt={entry.username}
                        className="w-10 h-10 rounded-full ring-2 ring-slate-700"
                      />
                      <div>
                        <p className="font-medium text-white">@{entry.username}</p>
                        <p className="text-xs text-slate-500">
                          {entry.totalChallenges} challenges
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-emerald-400 font-semibold">{entry.wins}W</span>
                    <span className="text-slate-500 mx-1">-</span>
                    <span className="text-red-400 font-semibold">{entry.losses}L</span>
                    {entry.draws > 0 && (
                      <>
                        <span className="text-slate-500 mx-1">-</span>
                        <span className="text-slate-400">{entry.draws}D</span>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn(
                      'text-lg font-bold',
                      entry.winRate >= 60 ? 'text-emerald-400' :
                      entry.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {entry.winRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn(
                      'font-semibold',
                      entry.xpEarned >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {entry.xpEarned >= 0 ? '+' : ''}{entry.xpEarned} XP
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <span className="text-amber-400" title="vs S&P 500 wins">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {entry.sp500Wins}
                      </span>
                      <span className="text-purple-400" title="vs User wins">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                        </svg>
                        {entry.userWins}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
