'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Portfolio, User } from '@/types';
import { useStore } from '@/store/useStore';
import { userStorage } from '@/lib/storage';
import { cn, formatCurrency, formatPercent, calculatePortfolioPerformance, getRelativeTime } from '@/lib/utils';
import { FormationField } from './FormationField';
import { Button } from '@/components/ui';

interface PortfolioCardProps {
  portfolio: Portfolio;
  showUser?: boolean;
  showActions?: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  showUser = true,
  showActions = true,
}) => {
  const { currentUser, likePortfolio, clonePortfolio } = useStore();
  const owner = userStorage.getUserById(portfolio.userId);

  const performance = useMemo(() => calculatePortfolioPerformance(portfolio), [portfolio]);

  const isOwner = currentUser?.id === portfolio.userId;
  const hasLiked = currentUser ? portfolio.likes.includes(currentUser.id) : false;
  const filledPositions = portfolio.players.filter((p) => p.asset !== null).length;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser) {
      likePortfolio(portfolio.id);
    }
  };

  const handleClone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser && !isOwner) {
      clonePortfolio(portfolio.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300"
    >
      <Link href={`/portfolio/${portfolio.id}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate">{portfolio.name}</h3>
              <p className="text-sm text-slate-400 truncate">{portfolio.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg">
                {portfolio.formation}
              </span>
            </div>
          </div>

          {/* User */}
          {showUser && owner && (
            <div className="flex items-center gap-2 mt-3">
              <img src={owner.avatar} alt={owner.username} className="w-6 h-6 rounded-full" />
              <span className="text-sm text-slate-400">@{owner.username}</span>
              <span className="text-xs text-slate-500">• {getRelativeTime(portfolio.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Formation Preview */}
        <div className="p-4">
          <div className="w-full max-w-[200px] mx-auto">
            <FormationField portfolio={portfolio} compact />
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-3 gap-4 py-3 border-t border-slate-800">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Value</p>
              <p className="font-semibold text-white">{formatCurrency(performance.totalValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Return</p>
              <p
                className={cn(
                  'font-semibold',
                  performance.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {formatPercent(performance.totalReturnPercent)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Players</p>
              <p className="font-semibold text-white">{filledPositions}/11</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  hasLiked
                    ? 'bg-pink-500/10 text-pink-400'
                    : 'bg-slate-800 text-slate-400 hover:text-pink-400'
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill={hasLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {portfolio.likes.length}
              </button>

              {!isOwner && (
                <button
                  onClick={handleClone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {portfolio.cloneCount}
                </button>
              )}

              <div className="flex-1" />

              <span className="text-xs text-slate-500">
                {portfolio.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
};
