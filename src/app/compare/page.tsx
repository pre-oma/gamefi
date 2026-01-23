'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { portfolioStorage, userStorage } from '@/lib/storage';
import { Header } from '@/components';
import {
  PortfolioSelector,
  MetricComparisonChart,
  ComparisonTable,
  ComparisonCard,
} from '@/components/compare';
import { Portfolio, User, PortfolioPerformance } from '@/types';
import { calculatePortfolioPerformance, formatPercent } from '@/lib/utils';

const MAX_PORTFOLIOS = 4;
const MIN_PORTFOLIOS = 2;

export default function ComparePage() {
  const { currentUser, isAuthenticated, loadData, portfolios, publicPortfolios } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>(['', '']);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load all users for displaying portfolio owners
  useEffect(() => {
    const allPortfolios = [...portfolios, ...publicPortfolios];
    const userIds = new Set(allPortfolios.map((p) => p.userId));
    const userMap = new Map<string, User>();

    userIds.forEach((userId) => {
      const user = userStorage.getUserById(userId);
      if (user) {
        userMap.set(userId, user);
      }
    });

    setUsers(userMap);
  }, [portfolios, publicPortfolios]);

  // Get selected portfolios with their performances
  const selectedPortfolios = useMemo(() => {
    return selectedIds
      .filter((id) => id !== '')
      .map((id) => {
        const portfolio = portfolioStorage.getById(id);
        if (!portfolio) return null;
        const performance = calculatePortfolioPerformance(portfolio);
        const owner = userStorage.getUserById(portfolio.userId) || null;
        return { portfolio, performance, owner };
      })
      .filter((item): item is { portfolio: Portfolio; performance: PortfolioPerformance; owner: User | null } => item !== null);
  }, [selectedIds]);

  const handleSelectPortfolio = (index: number, portfolioId: string) => {
    const newIds = [...selectedIds];
    newIds[index] = portfolioId;
    setSelectedIds(newIds);
  };

  const handleRemovePortfolio = (index: number) => {
    const newIds = [...selectedIds];
    newIds[index] = '';
    // Remove empty slots from the end, but keep at least MIN_PORTFOLIOS slots
    while (newIds.length > MIN_PORTFOLIOS && newIds[newIds.length - 1] === '') {
      newIds.pop();
    }
    setSelectedIds(newIds);
  };

  const handleAddSlot = () => {
    if (selectedIds.length < MAX_PORTFOLIOS) {
      setSelectedIds([...selectedIds, '']);
    }
  };

  const canCompare = selectedPortfolios.length >= MIN_PORTFOLIOS;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <div className="max-w-7xl mx-auto px-4 pt-24">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
            <p className="text-slate-400">You need to be logged in to compare portfolios.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Compare Portfolios</h1>
          <p className="text-slate-400">
            Compare up to {MAX_PORTFOLIOS} portfolios side by side to analyze their performance
          </p>
        </motion.div>

        {/* Portfolio Selectors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {selectedIds.map((_, index) => (
            <PortfolioSelector
              key={index}
              portfolios={portfolios}
              publicPortfolios={publicPortfolios}
              currentUserId={currentUser?.id || ''}
              selectedPortfolioIds={selectedIds}
              onSelect={(id) => handleSelectPortfolio(index, id)}
              users={users}
              index={index}
            />
          ))}

          {selectedIds.length < MAX_PORTFOLIOS && (
            <button
              onClick={handleAddSlot}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Portfolio
            </button>
          )}
        </motion.div>

        {/* Selected Portfolio Cards */}
        {selectedPortfolios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {selectedPortfolios.map((item, index) => (
              <ComparisonCard
                key={item.portfolio.id}
                portfolio={item.portfolio}
                owner={item.owner}
                performance={item.performance}
                onRemove={() => handleRemovePortfolio(selectedIds.indexOf(item.portfolio.id))}
                colorIndex={index}
              />
            ))}
          </motion.div>
        )}

        {/* Comparison Content */}
        {canCompare ? (
          <>
            {/* Metric Charts Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            >
              <MetricComparisonChart
                performances={selectedPortfolios.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="totalReturnPercent"
                title="Total Return"
                formatValue={(v) => formatPercent(v, true)}
                higherIsBetter={true}
              />
              <MetricComparisonChart
                performances={selectedPortfolios.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="sharpeRatio"
                title="Sharpe Ratio"
                formatValue={(v) => v.toFixed(2)}
                higherIsBetter={true}
              />
              <MetricComparisonChart
                performances={selectedPortfolios.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="beta"
                title="Beta"
                formatValue={(v) => v.toFixed(2)}
                higherIsBetter={false}
              />
              <MetricComparisonChart
                performances={selectedPortfolios.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="volatility"
                title="Volatility"
                formatValue={(v) => `${v.toFixed(1)}%`}
                higherIsBetter={false}
              />
              <MetricComparisonChart
                performances={selectedPortfolios.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="maxDrawdown"
                title="Max Drawdown"
                formatValue={(v) => `${v.toFixed(1)}%`}
                higherIsBetter={false}
              />
              <MetricComparisonChart
                performances={selectedPortfolios.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="winRate"
                title="Win Rate"
                formatValue={(v) => `${v.toFixed(1)}%`}
                higherIsBetter={true}
              />
            </motion.div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ComparisonTable
                portfolioNames={selectedPortfolios.map((p) => p.portfolio.name)}
                performances={selectedPortfolios.map((p) => p.performance)}
              />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center"
          >
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">Select Portfolios to Compare</h3>
            <p className="text-slate-400">
              Choose at least {MIN_PORTFOLIOS} portfolios from the dropdowns above to start comparing
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
