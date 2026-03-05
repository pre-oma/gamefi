'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { AppLayout, Input, PortfolioCard } from '@/components';
import { Formation, FORMATIONS } from '@/types';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

export default function ExplorePage() {
  const { resolvedTheme } = useTheme();
  const { publicPortfolios, refreshPortfolios, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<Formation | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'cloned'>('popular');

  useEffect(() => {
    refreshPortfolios();
  }, [refreshPortfolios]);

  const filteredPortfolios = useMemo(() => {
    // Filter out current user's portfolios - only show other people's teams
    let portfolios = publicPortfolios.filter(p => p.userId !== currentUser?.id);

    if (search) {
      const lowerSearch = search.toLowerCase();
      portfolios = portfolios.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.description?.toLowerCase().includes(lowerSearch)
      );
    }

    if (selectedFormation !== 'All') {
      portfolios = portfolios.filter((p) => p.formation === selectedFormation);
    }

    switch (sortBy) {
      case 'recent':
        portfolios.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        portfolios.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case 'cloned':
        portfolios.sort((a, b) => b.cloneCount - a.cloneCount);
        break;
    }

    return portfolios;
  }, [publicPortfolios, currentUser?.id, search, selectedFormation, sortBy]);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className={cn('text-3xl font-bold mb-2', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>Explore</h1>
        <p className={cn(resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Discover portfolios from the community and get inspired.</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-4 mb-8"
      >
        <div className="flex-1">
          <Input
            placeholder="Search portfolios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <select
          value={selectedFormation}
          onChange={(e) => setSelectedFormation(e.target.value as Formation | 'All')}
          className={cn(
            'rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 border',
            resolvedTheme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          )}
        >
          <option value="All">All Formations</option>
          {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
            <option key={formation} value={formation}>{formation}</option>
          ))}
        </select>

        <div className={cn(
          'flex gap-2 p-1 rounded-lg',
          resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'
        )}>
          {[
            { value: 'popular', label: 'Popular' },
            { value: 'recent', label: 'Recent' },
            { value: 'cloned', label: 'Most Cloned' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as typeof sortBy)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                sortBy === option.value
                  ? 'bg-emerald-500 text-white'
                  : resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {filteredPortfolios.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
            resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
          )}>
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className={cn('text-lg font-semibold mb-2', resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900')}>No portfolios found</h3>
          <p className={cn(resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
            {publicPortfolios.length === 0
              ? 'Be the first to create a public portfolio!'
              : 'Try adjusting your search or filters.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPortfolios.map((portfolio, index) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <PortfolioCard portfolio={portfolio} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppLayout>
  );
}
