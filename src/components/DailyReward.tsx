'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { DAILY_LOGIN_REWARDS } from '@/types';
import { cn } from '@/lib/utils';

interface DailyRewardProps {
  onClose?: () => void;
}

export const DailyReward: React.FC<DailyRewardProps> = ({ onClose }) => {
  const { currentUser, loadData } = useStore();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [streakInfo, setStreakInfo] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysClaimed: 0,
  });
  const [nextReward, setNextReward] = useState({
    streakDay: 1,
    baseXp: DAILY_LOGIN_REWARDS.BASE_XP,
    streakBonus: 0,
    totalXp: DAILY_LOGIN_REWARDS.BASE_XP,
  });
  const [claimedReward, setClaimedReward] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      checkDailyReward();
    }
  }, [currentUser]);

  const checkDailyReward = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rewards/daily?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setCanClaim(data.canClaim);
        setStreakInfo(data.streak);
        setNextReward(data.nextReward);
      }
    } catch (error) {
      console.error('Failed to check daily reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!currentUser || claiming || !canClaim) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/rewards/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimedReward(data.reward.xpAwarded);
        setClaimed(true);
        setCanClaim(false);
        setStreakInfo(data.streak);
        // Reload user data to update XP display
        loadData();
      }
    } catch (error) {
      console.error('Failed to claim daily reward:', error);
    } finally {
      setClaiming(false);
    }
  };

  const streakDays = Array.from({ length: 7 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {claimed ? (
          <motion.div
            key="claimed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Reward Claimed!</h3>
            <p className="text-4xl font-bold text-emerald-400 mb-4">+{claimedReward} XP</p>
            <p className="text-slate-400 mb-6">
              Streak: {streakInfo.currentStreak} day{streakInfo.currentStreak !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Awesome!
            </button>
          </motion.div>
        ) : (
          <motion.div key="unclaimed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Daily Login Reward</h3>
              <p className="text-slate-400">
                {canClaim
                  ? 'Claim your daily reward to keep your streak going!'
                  : 'Come back tomorrow for your next reward!'}
              </p>
            </div>

            {/* Streak Display */}
            <div className="flex justify-center gap-2 mb-6">
              {streakDays.map((day) => {
                const isCurrentDay = (streakInfo.currentStreak % 7 || 7) === day && canClaim;
                const isCompleted = !canClaim
                  ? day <= (streakInfo.currentStreak % 7 || 7)
                  : day < (streakInfo.currentStreak % 7) + 1;
                const isBonus = day === 7;

                return (
                  <div
                    key={day}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all',
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrentDay
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 animate-pulse'
                        : 'bg-slate-800 text-slate-500',
                      isBonus && !isCompleted && !isCurrentDay && 'border border-amber-500/50'
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isBonus ? (
                      <span className="text-amber-400">!</span>
                    ) : (
                      day
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reward Info */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Base Reward</span>
                <span className="text-white font-semibold">+{nextReward.baseXp} XP</span>
              </div>
              {nextReward.streakBonus > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-400">7-Day Streak Bonus!</span>
                  <span className="text-amber-400 font-semibold">+{nextReward.streakBonus} XP</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                <span className="text-white font-medium">Total</span>
                <span className="text-emerald-400 font-bold text-lg">+{nextReward.totalXp} XP</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{streakInfo.currentStreak}</p>
                <p className="text-xs text-slate-500">Current Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{streakInfo.longestStreak}</p>
                <p className="text-xs text-slate-500">Best Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{streakInfo.totalDaysClaimed}</p>
                <p className="text-xs text-slate-500">Total Days</p>
              </div>
            </div>

            {/* Claim Button */}
            <button
              onClick={claimReward}
              disabled={!canClaim || claiming}
              className={cn(
                'w-full py-3 rounded-xl font-semibold transition-all',
                canClaim
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              )}
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Claiming...
                </span>
              ) : canClaim ? (
                'Claim Reward'
              ) : (
                'Already Claimed Today'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
