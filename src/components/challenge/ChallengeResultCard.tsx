'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Challenge, CHALLENGE_TIMEFRAMES } from '@/types';
import { useStore } from '@/store/useStore';
import { cn, formatPercent, formatDate } from '@/lib/utils';

interface ChallengeResultCardProps {
  challenge: Challenge;
}

export const ChallengeResultCard: React.FC<ChallengeResultCardProps> = ({
  challenge,
}) => {
  const { currentUser } = useStore();

  const isChallenger = currentUser?.id === challenge.challengerId;
  const isOpponent = currentUser?.id === challenge.opponentId;
  const isWinner = challenge.winnerId === currentUser?.id;
  const isDraw = challenge.winnerId === null && challenge.status === 'completed';

  const timeframeLabel = CHALLENGE_TIMEFRAMES.find((t) => t.value === challenge.timeframe)?.label || challenge.timeframe;

  // Determine if user won/lost against S&P 500
  const sp500Winner = challenge.type === 'sp500' && challenge.winnerId === 'sp500';
  const userWonVsSp500 = challenge.type === 'sp500' && challenge.winnerId === challenge.challengerId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-slate-900/80 border rounded-2xl overflow-hidden transition-all duration-300',
        isWinner || userWonVsSp500 ? 'border-emerald-500/50' : isDraw ? 'border-slate-600' : 'border-red-500/50'
      )}
    >
      {/* Result Banner */}
      <div className={cn(
        'py-2 px-4 text-center text-sm font-medium',
        isWinner || userWonVsSp500
          ? 'bg-emerald-500/20 text-emerald-400'
          : isDraw
            ? 'bg-slate-700/50 text-slate-400'
            : 'bg-red-500/20 text-red-400'
      )}>
        {isWinner || userWonVsSp500 ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Victory! +{challenge.xpAwarded} XP
          </span>
        ) : isDraw ? (
          'Draw - No XP Change'
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Defeat -{challenge.xpAwarded} XP
          </span>
        )}
      </div>

      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {challenge.type === 'sp500' ? (
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white text-sm">
                {challenge.type === 'sp500' ? 'vs S&P 500' : 'vs User'}
              </h3>
              <p className="text-xs text-slate-400">{timeframeLabel} Challenge</p>
            </div>
          </div>
          <span className="text-xs text-slate-500">
            {challenge.settledAt && formatDate(challenge.settledAt)}
          </span>
        </div>
      </div>

      {/* Results Comparison */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {/* Challenger */}
          <div className={cn(
            'text-center p-3 rounded-xl',
            challenge.winnerId === challenge.challengerId ? 'bg-emerald-500/10' : 'bg-slate-800/50'
          )}>
            <img
              src={challenge.challengerAvatar || '/default-avatar.png'}
              alt={challenge.challengerUsername}
              className="w-10 h-10 rounded-full mx-auto mb-2"
            />
            <p className="text-xs font-medium text-white truncate">
              {isChallenger ? 'You' : challenge.challengerUsername}
            </p>
            <p className={cn(
              'text-lg font-bold mt-1',
              (challenge.challengerReturnPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {formatPercent(challenge.challengerReturnPercent || 0)}
            </p>
            {challenge.winnerId === challenge.challengerId && (
              <span className="inline-block mt-1 text-xs text-emerald-400">Winner</span>
            )}
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <span className="text-slate-500 text-sm">VS</span>
              <div className="mt-2 text-xs text-slate-400">
                {challenge.startDate && (
                  <p>{formatDate(challenge.startDate)}</p>
                )}
                <p>to</p>
                {challenge.endDate && (
                  <p>{formatDate(challenge.endDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Opponent */}
          <div className={cn(
            'text-center p-3 rounded-xl',
            challenge.winnerId === challenge.opponentId || challenge.winnerId === 'sp500' ? 'bg-emerald-500/10' : 'bg-slate-800/50'
          )}>
            {challenge.type === 'sp500' ? (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">SPY</span>
                </div>
                <p className="text-xs font-medium text-white">S&P 500</p>
              </>
            ) : (
              <>
                <img
                  src={challenge.opponentAvatar || '/default-avatar.png'}
                  alt={challenge.opponentUsername}
                  className="w-10 h-10 rounded-full mx-auto mb-2"
                />
                <p className="text-xs font-medium text-white truncate">
                  {isOpponent ? 'You' : challenge.opponentUsername}
                </p>
              </>
            )}
            <p className={cn(
              'text-lg font-bold mt-1',
              (challenge.opponentReturnPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {formatPercent(challenge.opponentReturnPercent || 0)}
            </p>
            {(challenge.winnerId === challenge.opponentId || challenge.winnerId === 'sp500') && (
              <span className="inline-block mt-1 text-xs text-emerald-400">Winner</span>
            )}
          </div>
        </div>

        {/* Performance Difference */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">Performance Difference</p>
          <p className={cn(
            'text-lg font-bold',
            ((challenge.challengerReturnPercent || 0) - (challenge.opponentReturnPercent || 0)) >= 0
              ? 'text-emerald-400'
              : 'text-red-400'
          )}>
            {formatPercent((challenge.challengerReturnPercent || 0) - (challenge.opponentReturnPercent || 0))}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
