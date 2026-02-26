'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { AppLayout, Button, Input, Modal } from '@/components';
import { cn, formatDate, calculateLevel } from '@/lib/utils';
import { ACHIEVEMENT_BADGES, BadgeRarity } from '@/types';

const BADGE_RARITY_COLORS: Record<BadgeRarity, string> = {
  common: 'bg-slate-600 text-slate-200',
  rare: 'bg-blue-600 text-blue-100',
  epic: 'bg-purple-600 text-purple-100',
  legendary: 'bg-amber-500 text-amber-900',
};

export default function ProfilePage() {
  const { currentUser, portfolios, updateProfile, challenges, completedChallenges } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const levelInfo = currentUser ? calculateLevel(currentUser.xp) : null;

  // Calculate stats
  const totalPortfolios = portfolios.length;
  const challengesWon = completedChallenges?.filter(c => c.winnerId === currentUser?.id).length || 0;
  const challengesLost = completedChallenges?.filter(c => c.winnerId && c.winnerId !== currentUser?.id).length || 0;
  const winRate = (challengesWon + challengesLost) > 0
    ? Math.round((challengesWon / (challengesWon + challengesLost)) * 100)
    : 0;

  // Get user badges (for now, show some earned based on stats)
  const earnedBadgeIds: string[] = [];

  // Check badge requirements
  if (totalPortfolios >= 1) earnedBadgeIds.push('first_portfolio');
  if (totalPortfolios >= 5) earnedBadgeIds.push('five_portfolios');
  if (challengesWon >= 1) earnedBadgeIds.push('first_win');
  if (challengesWon >= 10) earnedBadgeIds.push('ten_wins');
  if ((currentUser?.followers?.length || 0) >= 1) earnedBadgeIds.push('first_follower');
  if ((currentUser?.followers?.length || 0) >= 10) earnedBadgeIds.push('ten_followers');

  // Always show early adopter badge for beta users
  earnedBadgeIds.push('early_adopter');

  const earnedBadges = ACHIEVEMENT_BADGES.filter(b => earnedBadgeIds.includes(b.id));
  const allBadges = ACHIEVEMENT_BADGES;

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || currentUser.displayName,
        bio: bio.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.displayName}
                className="w-24 h-24 rounded-full ring-4 ring-emerald-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {levelInfo?.level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{currentUser?.displayName}</h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                  Level {levelInfo?.level}
                </span>
              </div>
              <p className="text-slate-400 mb-2">@{currentUser?.username}</p>
              <p className="text-slate-300 text-sm">{currentUser?.bio || 'No bio yet'}</p>
              <p className="text-slate-500 text-xs mt-2">
                Joined {currentUser?.joinedAt ? formatDate(currentUser.joinedAt) : 'Recently'}
              </p>
            </div>

            {/* Edit Button */}
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Button>
          </div>

          {/* XP Progress */}
          {levelInfo && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">XP Progress</span>
                <span className="text-sm text-emerald-400 font-medium">{currentUser?.xp} XP</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${(levelInfo.currentXp / levelInfo.nextLevelXp) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">{levelInfo.currentXp} XP</span>
                <span className="text-xs text-slate-500">{levelInfo.nextLevelXp} XP to Level {levelInfo.level + 1}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalPortfolios}</p>
            <p className="text-sm text-slate-400">Portfolios</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{challengesWon}</p>
            <p className="text-sm text-slate-400">Challenges Won</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{winRate}%</p>
            <p className="text-sm text-slate-400">Win Rate</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{currentUser?.followers?.length || 0}</p>
            <p className="text-sm text-slate-400">Followers</p>
          </div>
        </motion.div>

        {/* Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Badges Earned ({earnedBadges.length})</h2>

          {earnedBadges.length === 0 ? (
            <p className="text-slate-400 text-sm">No badges earned yet. Keep playing to earn achievements!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-colors"
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-sm font-medium text-white mb-1">{badge.name}</p>
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    BADGE_RARITY_COLORS[badge.rarity]
                  )}>
                    {badge.rarity}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Show locked badges */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              Badges to Unlock ({allBadges.length - earnedBadges.length})
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {allBadges
                .filter(b => !earnedBadgeIds.includes(b.id))
                .slice(0, 6)
                .map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 text-center opacity-50"
                    title={badge.description}
                  >
                    <div className="text-xl mb-1 grayscale">{badge.icon}</div>
                    <p className="text-xs text-slate-500 truncate">{badge.name}</p>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">My Portfolios</h2>

          {portfolios.length === 0 ? (
            <p className="text-slate-400 text-sm">No portfolios created yet.</p>
          ) : (
            <div className="space-y-3">
              {portfolios.slice(0, 5).map((portfolio) => (
                <a
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-400 font-bold text-sm">{portfolio.formation}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{portfolio.name}</p>
                      <p className="text-xs text-slate-400">
                        {portfolio.players.filter(p => p.asset).length}/11 positions filled
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile">
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
