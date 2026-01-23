'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Header, Input, PortfolioCard } from '@/components';
import { Formation, FORMATIONS } from '@/types';

export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadData, publicPortfolios, refreshPortfolios } = useStore();
  const [search, setSearch] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<Formation | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'cloned'>('popular');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    refreshPortfolios();
  }, [refreshPortfolios]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const filteredPortfolios = useMemo(() => {
    let portfolios = [...publicPortfolios];

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
  }, [publicPortfolios, search, selectedFormation, sortBy]);

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
          <p className="text-slate-400">Discover portfolios from the community and get inspired.</p>
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
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Formations</option>
            {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
              <option key={formation} value={formation}>{formation}</option>
            ))}
          </select>

          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg">
            {[
              { value: 'popular', label: 'Popular' },
              { value: 'recent', label: 'Recent' },
              { value: 'cloned', label: 'Most Cloned' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as typeof sortBy)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === option.value
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
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
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No portfolios found</h3>
            <p className="text-slate-400">
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
      </main>
    </div>
  );
}
