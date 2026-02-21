'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { portfolioStorage, userStorage } from '@/lib/storage';
import { Header } from '@/components';
import {
  PortfolioSelector,
  MetricComparisonChart,
  ComparisonTable,
  ComparisonCard,
  BenchmarkSelector,
  TimeframeSelector,
  PerformanceLineChart,
  CustomDateRangeSelector,
  CustomSymbolSearch,
} from '@/components/compare';
import {
  Portfolio,
  User,
  PortfolioPerformance,
  BenchmarkSymbol,
  BenchmarkPerformance,
  ComparisonTimeframe,
  CustomDateRange,
  CustomComparisonSymbol,
} from '@/types';
import { calculatePortfolioPerformance, formatPercent } from '@/lib/utils';
import {
  getMultipleBenchmarkPerformances,
  getMultipleCustomSymbolPerformances,
} from '@/lib/benchmarkData';
import { calculatePortfolioHistoricalData, calculateMetricsFromHistoricalData } from '@/lib/portfolioHistoricalData';
import { PortfolioHistoricalPoint } from '@/types';

const MAX_PORTFOLIOS = 4;
const MIN_PORTFOLIOS = 1;

export default function ComparePage() {
  const { currentUser, isAuthenticated, loadData, portfolios, publicPortfolios } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>(['']);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<BenchmarkSymbol[]>([]);
  const [benchmarkPerformances, setBenchmarkPerformances] = useState<BenchmarkPerformance[]>([]);
  const [timeframe, setTimeframe] = useState<ComparisonTimeframe>('1M');
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange | null>(null);
  const [customSymbols, setCustomSymbols] = useState<CustomComparisonSymbol[]>([]);
  const [customSymbolPerformances, setCustomSymbolPerformances] = useState<BenchmarkPerformance[]>([]);
  const [portfolioHistoricalData, setPortfolioHistoricalData] = useState<Map<string, PortfolioHistoricalPoint[]>>(new Map());
  const [loadingPortfolioData, setLoadingPortfolioData] = useState(false);

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

  // Fetch benchmark data when selected benchmarks, timeframe, or custom date range changes
  useEffect(() => {
    const fetchAllBenchmarks = async () => {
      setLoadingBenchmarks(true);
      try {
        // Fetch predefined benchmarks
        let benchmarkResults: BenchmarkPerformance[] = [];
        if (selectedBenchmarks.length > 0) {
          benchmarkResults = await getMultipleBenchmarkPerformances(
            selectedBenchmarks,
            timeframe,
            customDateRange
          );
        }
        setBenchmarkPerformances(benchmarkResults);

        // Fetch custom symbols
        let customResults: BenchmarkPerformance[] = [];
        if (customSymbols.length > 0) {
          customResults = await getMultipleCustomSymbolPerformances(
            customSymbols,
            timeframe,
            customDateRange
          );
        }
        setCustomSymbolPerformances(customResults);
      } catch (error) {
        console.error('Failed to fetch benchmark data:', error);
        setBenchmarkPerformances([]);
        setCustomSymbolPerformances([]);
      } finally {
        setLoadingBenchmarks(false);
      }
    };

    if (selectedBenchmarks.length > 0 || customSymbols.length > 0) {
      fetchAllBenchmarks();
    } else {
      setBenchmarkPerformances([]);
      setCustomSymbolPerformances([]);
    }
  }, [selectedBenchmarks, customSymbols, timeframe, customDateRange]);

  // Fetch real historical data for selected portfolios
  useEffect(() => {
    const fetchPortfolioHistorical = async () => {
      const portfolioIds = selectedIds.filter((id) => id !== '');
      if (portfolioIds.length === 0) {
        setPortfolioHistoricalData(new Map());
        return;
      }

      setLoadingPortfolioData(true);
      try {
        const newDataMap = new Map<string, PortfolioHistoricalPoint[]>();

        await Promise.all(
          portfolioIds.map(async (id) => {
            const portfolio = portfolioStorage.getById(id);
            if (portfolio) {
              const historicalData = await calculatePortfolioHistoricalData(
                portfolio,
                timeframe,
                customDateRange
              );
              newDataMap.set(id, historicalData);
            }
          })
        );

        setPortfolioHistoricalData(newDataMap);
      } catch (error) {
        console.error('Failed to fetch portfolio historical data:', error);
      } finally {
        setLoadingPortfolioData(false);
      }
    };

    fetchPortfolioHistorical();
  }, [selectedIds, timeframe, customDateRange]);

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

  // Enhance portfolios with real metrics from historical data
  const selectedPortfoliosWithRealMetrics = useMemo(() => {
    return selectedPortfolios.map((item) => {
      const historicalData = portfolioHistoricalData.get(item.portfolio.id);
      if (historicalData && historicalData.length > 1) {
        // Calculate real metrics from Yahoo Finance data
        const realMetrics = calculateMetricsFromHistoricalData(historicalData);
        return {
          ...item,
          performance: {
            ...item.performance,
            totalReturnPercent: realMetrics.totalReturnPercent,
            volatility: realMetrics.volatility,
            sharpeRatio: realMetrics.sharpeRatio,
            maxDrawdown: realMetrics.maxDrawdown,
          },
        };
      }
      return item;
    });
  }, [selectedPortfolios, portfolioHistoricalData]);

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

  const handleToggleBenchmark = useCallback((symbol: BenchmarkSymbol) => {
    setSelectedBenchmarks((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }
      return [...prev, symbol];
    });
  }, []);

  const handleAddCustomSymbol = useCallback((symbol: CustomComparisonSymbol) => {
    setCustomSymbols((prev) => [...prev, symbol]);
  }, []);

  const handleRemoveCustomSymbol = useCallback((symbol: string) => {
    setCustomSymbols((prev) => prev.filter((s) => s.symbol !== symbol));
  }, []);

  // Combine all benchmark performances for display
  const allBenchmarkPerformances = useMemo(() => {
    return [...benchmarkPerformances, ...customSymbolPerformances];
  }, [benchmarkPerformances, customSymbolPerformances]);

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
            {selectedPortfoliosWithRealMetrics.map((item, index) => (
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

        {/* Benchmark Selection and Timeframe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <div className="flex-1">
            <BenchmarkSelector
              selectedBenchmarks={selectedBenchmarks}
              onToggle={handleToggleBenchmark}
              maxSelections={3}
            />
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Timeframe</h3>
              <div className="flex items-center gap-3">
                <TimeframeSelector
                  selectedTimeframe={timeframe}
                  onSelect={(tf) => {
                    setTimeframe(tf);
                    setCustomDateRange(null); // Clear custom range when preset selected
                  }}
                  disabled={loadingBenchmarks || customDateRange !== null}
                />
                <CustomDateRangeSelector
                  dateRange={customDateRange}
                  onDateRangeChange={setCustomDateRange}
                  disabled={loadingBenchmarks}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Custom Symbol Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-8"
        >
          <CustomSymbolSearch
            customSymbols={customSymbols}
            onAddSymbol={handleAddCustomSymbol}
            onRemoveSymbol={handleRemoveCustomSymbol}
            maxSymbols={5}
          />
        </motion.div>

        {/* Comparison Content */}
        {canCompare ? (
          <>
            {/* Performance Line Chart */}
            {(selectedPortfoliosWithRealMetrics.length > 0 || allBenchmarkPerformances.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <PerformanceLineChart
                  portfolios={selectedPortfoliosWithRealMetrics.map((p, index) => ({
                    name: p.portfolio.name,
                    color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 4],
                    performance: p.performance,
                    createdAt: p.portfolio.createdAt,
                    realHistoricalData: portfolioHistoricalData.get(p.portfolio.id),
                  }))}
                  benchmarks={allBenchmarkPerformances}
                />
                {(loadingBenchmarks || loadingPortfolioData) && (
                  <div className="text-center text-slate-500 text-sm mt-2">
                    Loading {loadingPortfolioData ? 'portfolio' : 'benchmark'} data...
                  </div>
                )}
              </motion.div>
            )}

            {/* Metric Charts Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            >
              <MetricComparisonChart
                performances={selectedPortfoliosWithRealMetrics.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                benchmarks={allBenchmarkPerformances}
                metricKey="totalReturnPercent"
                title="Total Return"
                formatValue={(v) => formatPercent(v, true)}
                higherIsBetter={true}
              />
              <MetricComparisonChart
                performances={selectedPortfoliosWithRealMetrics.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                benchmarks={allBenchmarkPerformances}
                metricKey="sharpeRatio"
                title="Sharpe Ratio"
                formatValue={(v) => v.toFixed(2)}
                higherIsBetter={true}
              />
              <MetricComparisonChart
                performances={selectedPortfoliosWithRealMetrics.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                metricKey="beta"
                title="Beta"
                formatValue={(v) => v.toFixed(2)}
                higherIsBetter={false}
              />
              <MetricComparisonChart
                performances={selectedPortfoliosWithRealMetrics.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                benchmarks={allBenchmarkPerformances}
                metricKey="volatility"
                title="Volatility"
                formatValue={(v) => `${v.toFixed(1)}%`}
                higherIsBetter={false}
              />
              <MetricComparisonChart
                performances={selectedPortfoliosWithRealMetrics.map((p) => ({
                  name: p.portfolio.name.slice(0, 15),
                  performance: p.performance,
                }))}
                benchmarks={allBenchmarkPerformances}
                metricKey="maxDrawdown"
                title="Max Drawdown"
                formatValue={(v) => `${v.toFixed(1)}%`}
                higherIsBetter={false}
              />
              <MetricComparisonChart
                performances={selectedPortfoliosWithRealMetrics.map((p) => ({
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
                portfolioNames={selectedPortfoliosWithRealMetrics.map((p) => p.portfolio.name)}
                performances={selectedPortfoliosWithRealMetrics.map((p) => p.performance)}
                benchmarks={allBenchmarkPerformances}
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
