'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Portfolio, User } from '@/types';
import { useStore } from '@/store/useStore';
import { userStorage } from '@/lib/storage';
import { cn, formatCurrency, formatPercent, getRelativeTime, formatDate } from '@/lib/utils';
import { FormationField } from './FormationField';
import { Button } from '@/components/ui';
import { usePortfolioRealPerformance } from '@/hooks/usePortfolioRealPerformance';
import { useTheme } from '@/components/ThemeProvider';

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
  const { resolvedTheme } = useTheme();
  const { currentUser, likePortfolio, clonePortfolio } = useStore();
  const owner = userStorage.getUserById(portfolio.userId);

  // Use real performance data from Yahoo Finance
  const { performance, isLoading, isRealData } = usePortfolioRealPerformance(portfolio);

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
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300 border',
        resolvedTheme === 'dark'
          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      )}
    >
      <Link href={`/portfolio/${portfolio.id}`}>
        {/* Header */}
        <div className={cn(
          'p-4 border-b',
          resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={cn('font-semibold truncate', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{portfolio.name}</h3>
              <p className={cn('text-sm truncate', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>{portfolio.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-lg">
                {portfolio.formation}
              </span>
            </div>
          </div>

          {/* User */}
          {showUser && owner && (
            <div className="flex items-center gap-2 mt-3">
              <img src={owner.avatar} alt={owner.username} className="w-6 h-6 rounded-full" />
              <span className={cn('text-sm', resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>@{owner.username}</span>
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
          <div className={cn(
            'grid grid-cols-4 gap-2 py-3 border-t',
            resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          )}>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Value</p>
              <p className={cn('font-semibold text-sm', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{formatCurrency(performance.totalValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">
                Return {isRealData && <span className="text-emerald-500">•</span>}
              </p>
              {isLoading ? (
                <div className={cn('w-12 h-5 animate-pulse rounded mx-auto', resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')} />
              ) : (
                <p
                  className={cn(
                    'font-semibold text-sm',
                    performance.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {formatPercent(performance.totalReturnPercent)}
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Created</p>
              <p className={cn('font-semibold text-sm', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{formatDate(portfolio.createdAt)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Players</p>
              <p className={cn('font-semibold text-sm', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>{filledPositions}/11</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="px-4 pb-4">
            <div className={cn(
              'flex items-center gap-2 pt-2 border-t',
              resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            )}>
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  hasLiked
                    ? 'bg-pink-500/10 text-pink-400'
                    : resolvedTheme === 'dark'
                      ? 'bg-slate-800 text-slate-400 hover:text-pink-400'
                      : 'bg-slate-100 text-slate-600 hover:text-pink-500'
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
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    resolvedTheme === 'dark'
                      ? 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 hover:text-emerald-500'
                  )}
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
