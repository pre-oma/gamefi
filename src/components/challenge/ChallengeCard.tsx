'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Challenge, CHALLENGE_XP, CHALLENGE_TIMEFRAMES } from '@/types';
import { useStore } from '@/store/useStore';
import { cn, formatPercent, getRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';

interface ChallengeCardProps {
  challenge: Challenge;
  showActions?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  showActions = true,
}) => {
  const { currentUser, acceptChallenge, declineChallenge, cancelChallenge, portfolios } = useStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = React.useState<string>('');

  const isChallenger = currentUser?.id === challenge.challengerId;
  const isOpponent = currentUser?.id === challenge.opponentId;
  const isPending = challenge.status === 'pending';
  const isActive = challenge.status === 'active';
  const xpAtStake = challenge.type === 'sp500' ? CHALLENGE_XP.VS_SP500 : CHALLENGE_XP.VS_USER;

  const timeframeLabel = CHALLENGE_TIMEFRAMES.find((t) => t.value === challenge.timeframe)?.label || challenge.timeframe;

  // Calculate time remaining for active challenges
  const getTimeRemaining = () => {
    if (!challenge.endDate) return null;
    const end = new Date(challenge.endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const handleAccept = async () => {
    if (!selectedPortfolioId) return;
    setIsLoading(true);
    await acceptChallenge(challenge.id, selectedPortfolioId);
    setIsLoading(false);
  };

  const handleDecline = async () => {
    setIsLoading(true);
    await declineChallenge(challenge.id);
    setIsLoading(false);
  };

  const handleCancel = async () => {
    setIsLoading(true);
    await cancelChallenge(challenge.id);
    setIsLoading(false);
  };

  const getStatusBadge = () => {
    switch (challenge.status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-lg">
            Pending
          </span>
        );
      case 'active':
        return (
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg">
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg">
            Completed
          </span>
        );
      case 'declined':
        return (
          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg">
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs font-medium rounded-lg">
            Cancelled
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {challenge.type === 'sp500' ? (
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white">
                {challenge.type === 'sp500' ? 'vs S&P 500' : 'vs User'}
              </h3>
              <p className="text-sm text-slate-400">{timeframeLabel} Challenge</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* VS Display */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Challenger */}
          <div className="flex-1 text-center">
            <img
              src={challenge.challengerAvatar || '/default-avatar.png'}
              alt={challenge.challengerUsername}
              className="w-12 h-12 rounded-full mx-auto mb-2 ring-2 ring-emerald-500/30"
            />
            <p className="text-sm font-medium text-white truncate">
              {isChallenger ? 'You' : challenge.challengerUsername}
            </p>
            <p className="text-xs text-slate-400 truncate">{challenge.challengerPortfolioName}</p>
            {isActive && challenge.challengerReturnPercent !== null && (
              <p className={cn(
                'text-sm font-semibold mt-1',
                challenge.challengerReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {formatPercent(challenge.challengerReturnPercent)}
              </p>
            )}
          </div>

          {/* VS */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-slate-400">VS</span>
            </div>
            <p className="text-xs text-slate-500 text-center mt-1">{xpAtStake} XP</p>
          </div>

          {/* Opponent */}
          <div className="flex-1 text-center">
            {challenge.type === 'sp500' ? (
              <>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">SPY</span>
                </div>
                <p className="text-sm font-medium text-white">S&P 500</p>
                <p className="text-xs text-slate-400">Index</p>
                {isActive && challenge.opponentReturnPercent !== null && (
                  <p className={cn(
                    'text-sm font-semibold mt-1',
                    challenge.opponentReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {formatPercent(challenge.opponentReturnPercent)}
                  </p>
                )}
              </>
            ) : (
              <>
                <img
                  src={challenge.opponentAvatar || '/default-avatar.png'}
                  alt={challenge.opponentUsername}
                  className="w-12 h-12 rounded-full mx-auto mb-2 ring-2 ring-purple-500/30"
                />
                <p className="text-sm font-medium text-white truncate">
                  {isOpponent ? 'You' : challenge.opponentUsername}
                </p>
                <p className="text-xs text-slate-400 truncate">{challenge.opponentPortfolioName}</p>
                {isActive && challenge.opponentReturnPercent !== null && (
                  <p className={cn(
                    'text-sm font-semibold mt-1',
                    challenge.opponentReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {formatPercent(challenge.opponentReturnPercent)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Time/Status Info */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between py-3 border-t border-slate-800 text-sm">
          <span className="text-slate-400">
            {isActive ? getTimeRemaining() : `Created ${getRelativeTime(challenge.createdAt)}`}
          </span>
          {challenge.startDate && (
            <span className="text-slate-500">
              Started {new Date(challenge.startDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800">
          {/* Pending invite - show accept/decline for opponent */}
          {isPending && isOpponent && (
            <div className="space-y-3">
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select your portfolio</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={isLoading || !selectedPortfolioId}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={isLoading}
                  variant="ghost"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Pending - show cancel for challenger */}
          {isPending && isChallenger && (
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              variant="ghost"
              className="w-full"
            >
              Cancel Challenge
            </Button>
          )}

          {/* Active - show progress indicator */}
          {isActive && (
            <div className="text-center text-sm text-slate-400">
              Challenge in progress...
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
