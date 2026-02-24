'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChallengeType,
  ChallengeTimeframe,
  CHALLENGE_XP,
  CHALLENGE_TIMEFRAMES,
  MAX_ACTIVE_CHALLENGES,
} from '@/types';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    portfolios,
    publicPortfolios,
    createChallenge,
    canCreateChallenge,
    getActiveChallengesCount,
  } = useStore();

  const [step, setStep] = useState(1);
  const [challengeType, setChallengeType] = useState<ChallengeType>('sp500');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChallengeTimeframe>('1W');
  const [opponentPortfolioId, setOpponentPortfolioId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = getActiveChallengesCount();
  const xpAtStake = challengeType === 'sp500' ? CHALLENGE_XP.VS_SP500 : CHALLENGE_XP.VS_USER;
  const canCreate = canCreateChallenge(challengeType);

  // Get opponent portfolios (public portfolios from other users)
  const opponentPortfolios = publicPortfolios.filter(
    (p) => p.userId !== currentUser?.id
  );

  const handleCreate = async () => {
    if (!selectedPortfolioId) {
      setError('Please select your portfolio');
      return;
    }

    if (challengeType === 'user' && !opponentPortfolioId) {
      setError('Please select an opponent portfolio');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Find opponent user ID from the selected portfolio
    const opponentPortfolio = opponentPortfolios.find((p) => p.id === opponentPortfolioId);

    const result = await createChallenge(
      selectedPortfolioId,
      challengeType,
      selectedTimeframe,
      opponentPortfolio?.userId,
      opponentPortfolioId || undefined
    );

    setIsLoading(false);

    if (result.success) {
      onClose();
      resetForm();
    } else {
      setError(result.error || 'Failed to create challenge');
    }
  };

  const resetForm = () => {
    setStep(1);
    setChallengeType('sp500');
    setSelectedPortfolioId('');
    setSelectedTimeframe('1W');
    setOpponentPortfolioId('');
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Create Challenge</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Active: {activeCount}/{MAX_ACTIVE_CHALLENGES}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Can't create warning */}
            {!canCreate.canCreate && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                {canCreate.reason}
              </div>
            )}

            {/* Step 1: Challenge Type */}
            {step === 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Challenge Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setChallengeType('sp500')}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      challengeType === 'sp500'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    )}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">vs S&P 500</h3>
                    <p className="text-xs text-slate-400 mt-1">Beat the market index</p>
                    <p className="text-sm text-amber-400 mt-2">{CHALLENGE_XP.VS_SP500} XP at stake</p>
                  </button>

                  <button
                    onClick={() => setChallengeType('user')}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      challengeType === 'user'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    )}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">vs User</h3>
                    <p className="text-xs text-slate-400 mt-1">Challenge another player</p>
                    <p className="text-sm text-purple-400 mt-2">{CHALLENGE_XP.VS_USER} XP at stake</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Your Portfolio */}
            {step >= 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Your Portfolio
                </label>
                <select
                  value={selectedPortfolioId}
                  onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select a portfolio</option>
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.formation})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 3: Select Timeframe */}
            {step >= 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CHALLENGE_TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setSelectedTimeframe(tf.value)}
                      className={cn(
                        'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                        selectedTimeframe === tf.value
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Select Opponent (for user challenges) */}
            {challengeType === 'user' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Opponent Portfolio
                </label>
                {opponentPortfolios.length === 0 ? (
                  <p className="text-sm text-slate-400">No public portfolios available to challenge</p>
                ) : (
                  <select
                    value={opponentPortfolioId}
                    onChange={(e) => setOpponentPortfolioId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select opponent portfolio</option>
                    {opponentPortfolios.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.formation})</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Challenge Type</span>
                <span className="text-white">{challengeType === 'sp500' ? 'vs S&P 500' : 'vs User'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Duration</span>
                <span className="text-white">{CHALLENGE_TIMEFRAMES.find(t => t.value === selectedTimeframe)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">XP at Stake</span>
                <span className={cn(
                  'font-semibold',
                  challengeType === 'sp500' ? 'text-amber-400' : 'text-purple-400'
                )}>
                  {xpAtStake} XP
                </span>
              </div>
              {currentUser && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Your Current XP</span>
                  <span className="text-white">{currentUser.xp} XP</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 flex gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading || !canCreate.canCreate || !selectedPortfolioId || (challengeType === 'user' && !opponentPortfolioId)}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
