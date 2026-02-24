'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useStore } from '@/store/useStore';
// Storage imports removed - now using API
import { Header, Button, FormationField, AssetSelector, Modal, DateRangePicker } from '@/components';
import { Position, PortfolioPlayer, Portfolio } from '@/types';
import {
  cn,
  formatCurrency,
  formatPercent,
  formatDate,
  calculatePortfolioPerformance,
  calculatePortfolioPerformanceForDateRange,
  exportPortfolioToCSV,
  getShareUrl,
  copyToClipboard,
  formatPE,
  formatEPS,
  formatPercentMetric,
  formatRatio,
} from '@/lib/utils';
import { usePortfolioFundamentals } from '@/hooks/usePortfolioFundamentals';

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

// Stable empty portfolio reference for when portfolio is null
const EMPTY_PORTFOLIO: Portfolio = {
  id: '', userId: '', name: '', description: '', formation: '4-3-3',
  players: [], createdAt: '', updatedAt: '', isPublic: false,
  likes: [], cloneCount: 0, clonedFrom: null, tags: []
};

export default function PortfolioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.id as string;

  const { currentUser, isAuthenticated, loadData, assignAssetToPosition, likePortfolio, clonePortfolio, deletePortfolio } = useStore();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<{ player: PortfolioPlayer; position: Position } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null);

  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`/api/portfolios?id=${portfolioId}`);
        const data = await res.json();
        if (data.success && data.portfolios?.length > 0) {
          setPortfolio(data.portfolios[0]);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      }
    };
    fetchPortfolio();
  }, [portfolioId]);

  useEffect(() => {
    const fetchOwner = async () => {
      if (!portfolio) return;
      try {
        const res = await fetch(`/api/users?id=${portfolio.userId}`);
        const data = await res.json();
        if (data.success) {
          setOwner(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch owner:', error);
      }
    };
    fetchOwner();
  }, [portfolio]);
  const isOwner = currentUser?.id === portfolio?.userId;
  const hasLiked = currentUser && portfolio ? portfolio.likes.includes(currentUser.id) : false;

  const performance = useMemo(() => {
    if (!portfolio) return null;
    if (dateRangeStart && dateRangeEnd) {
      return calculatePortfolioPerformanceForDateRange(portfolio, dateRangeStart, dateRangeEnd);
    }
    return calculatePortfolioPerformance(portfolio);
  }, [portfolio, dateRangeStart, dateRangeEnd]);

  // Fetch fundamental metrics for portfolio
  const { aggregateMetrics, alpha, benchmarkReturn, isLoading: fundamentalsLoading } = usePortfolioFundamentals(
    portfolio || EMPTY_PORTFOLIO,
    performance?.totalReturnPercent || 0,
    performance?.beta || 1,
    { enabled: !!portfolio && portfolio.players.some(p => p.asset) }
  );

  const portfolioMinDate = useMemo(() => {
    if (!portfolio) return new Date();
    return new Date(portfolio.createdAt);
  }, [portfolio]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRangeStart(start);
    setDateRangeEnd(end);
  };

  const sectorData = useMemo(() => {
    if (!portfolio) return [];

    const sectors: Record<string, number> = {};
    portfolio.players.forEach((player) => {
      if (player.asset) {
        sectors[player.asset.sector] = (sectors[player.asset.sector] || 0) + 1;
      }
    });

    return Object.entries(sectors).map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [portfolio]);

  const handlePositionClick = (player: PortfolioPlayer, position: Position) => {
    if (!isOwner) return;
    setSelectedPosition({ player, position });
  };

  const handleAssetSelect = async (asset: any) => {
    if (!selectedPosition || !portfolio) return;
    await assignAssetToPosition(portfolio.id, selectedPosition.player.positionId, asset);
    // Refresh portfolio from API
    const res = await fetch(`/api/portfolios?id=${portfolio.id}`);
    const data = await res.json();
    if (data.success && data.portfolios?.length > 0) {
      setPortfolio(data.portfolios[0]);
    }
    setSelectedPosition(null);
  };

  const handleLike = async () => {
    if (!portfolio) return;
    likePortfolio(portfolio.id);
    // Update local state for likes
    const hasLikedNow = portfolio.likes.includes(currentUser?.id || '');
    setPortfolio({
      ...portfolio,
      likes: hasLikedNow
        ? portfolio.likes.filter(id => id !== currentUser?.id)
        : [...portfolio.likes, currentUser?.id || ''],
    });
  };

  const handleClone = async () => {
    if (!portfolio) return;
    const cloned = await clonePortfolio(portfolio.id);
    if (cloned) {
      router.push(`/portfolio/${cloned.id}`);
    }
  };

  const handleDelete = async () => {
    if (!portfolio) return;
    await deletePortfolio(portfolio.id);
    router.push('/dashboard');
  };

  const handleExport = () => {
    if (!portfolio || !performance) return;
    exportPortfolioToCSV(portfolio, performance);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <div className="max-w-7xl mx-auto px-4 pt-24">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Portfolio Not Found</h1>
            <p className="text-slate-400 mb-6">This portfolio doesn't exist or has been deleted.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filledPositions = portfolio.players.filter((p) => p.asset !== null).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{portfolio.name}</h1>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-full">
                  {portfolio.formation}
                </span>
              </div>
              <p className="text-slate-400">{portfolio.description || 'No description'}</p>
              {owner && (
                <div className="flex items-center gap-2 mt-3">
                  <img src={owner.avatar} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-slate-400">@{owner.username}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500 text-sm">{formatDate(portfolio.createdAt)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  hasLiked ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-400 hover:text-pink-400'
                )}
              >
                <svg
                  className="w-5 h-5"
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
                <Button variant="outline" onClick={handleClone}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Clone
                </Button>
              )}

              <Button variant="outline" onClick={() => setShowShareModal(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </Button>

              <Button variant="outline" onClick={handleExport}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </Button>

              {isOwner && (
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {performance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Total Value</p>
              <p className="text-lg font-bold text-white">{formatCurrency(performance.totalValue)}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Total Return</p>
              <p className={cn('text-lg font-bold', performance.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatPercent(performance.totalReturnPercent)}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500">Day Return</p>
                {/* Trend indicator */}
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  performance.dayVsPreviousDay >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  <svg
                    className={cn('w-3 h-3', performance.dayVsPreviousDay < 0 && 'rotate-180')}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{performance.dayVsPreviousDay >= 0 ? '+' : ''}{performance.dayVsPreviousDay.toFixed(2)}%</span>
                </div>
              </div>
              <p className={cn('text-lg font-bold', performance.dayReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatPercent(performance.dayReturnPercent)}
              </p>
              <p className="text-xs text-slate-500 mt-1">vs yesterday</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500">Week Return</p>
                {/* Trend indicator */}
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  performance.weekVsPreviousWeek >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  <svg
                    className={cn('w-3 h-3', performance.weekVsPreviousWeek < 0 && 'rotate-180')}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{performance.weekVsPreviousWeek >= 0 ? '+' : ''}{performance.weekVsPreviousWeek.toFixed(2)}%</span>
                </div>
              </div>
              <p className={cn('text-lg font-bold', performance.weekReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatPercent(performance.weekReturnPercent)}
              </p>
              <p className="text-xs text-slate-500 mt-1">vs last week</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Beta</p>
              <p className="text-lg font-bold text-white">{performance.beta.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500">Trend</p>
                <div className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  performance.isImproving ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                )}>
                  {performance.isImproving ? 'Improving' : 'Declining'}
                </div>
              </div>
              <p className="text-lg font-bold text-white">{filledPositions}/11</p>
              <p className="text-xs text-slate-500 mt-1">players filled</p>
            </div>
          </motion.div>
        )}

        {/* Fundamental Metrics Section */}
        {performance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-3">Fundamental Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {/* Alpha */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Alpha</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className={cn(
                    'text-sm font-bold',
                    alpha !== null && alpha >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {alpha !== null ? `${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%` : 'N/A'}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-0.5">vs SPY</p>
              </div>

              {/* Weighted P/E */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg P/E</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className="text-sm font-bold text-white">{formatPE(aggregateMetrics.weightedPE)}</p>
                )}
              </div>

              {/* Weighted EPS */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg EPS</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className="text-sm font-bold text-white">{formatEPS(aggregateMetrics.weightedEPS)}</p>
                )}
              </div>

              {/* Weighted PEG */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg PEG</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className="text-sm font-bold text-white">{formatRatio(aggregateMetrics.weightedPEG)}</p>
                )}
              </div>

              {/* Weighted ROE */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg ROE</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className={cn(
                    'text-sm font-bold',
                    aggregateMetrics.weightedROE !== null && aggregateMetrics.weightedROE > 0 ? 'text-emerald-400' : 'text-white'
                  )}>
                    {formatPercentMetric(aggregateMetrics.weightedROE)}
                  </p>
                )}
              </div>

              {/* Weighted Profit Margin */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg Margin</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className={cn(
                    'text-sm font-bold',
                    aggregateMetrics.weightedProfitMargin !== null && aggregateMetrics.weightedProfitMargin > 0 ? 'text-emerald-400' : 'text-white'
                  )}>
                    {formatPercentMetric(aggregateMetrics.weightedProfitMargin)}
                  </p>
                )}
              </div>

              {/* Weighted P/B */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg P/B</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className="text-sm font-bold text-white">{formatRatio(aggregateMetrics.weightedPriceToBook)}</p>
                )}
              </div>

              {/* Weighted D/E */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Avg D/E</p>
                {fundamentalsLoading ? (
                  <div className="w-12 h-5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className={cn(
                    'text-sm font-bold',
                    aggregateMetrics.weightedDebtToEquity !== null && aggregateMetrics.weightedDebtToEquity > 1.5 ? 'text-amber-400' : 'text-white'
                  )}>
                    {formatRatio(aggregateMetrics.weightedDebtToEquity)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formation Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Team Formation</h2>
            <FormationField
              portfolio={portfolio}
              onPositionClick={handlePositionClick}
              isEditable={isOwner}
            />
            {isOwner && (
              <p className="text-sm text-slate-500 text-center mt-4">Click on a position to assign an asset</p>
            )}
          </motion.div>

          {/* Charts */}
          <div className="space-y-6">
            {/* Performance Chart */}
            {performance && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-white">Performance History</h2>
                </div>
                <div className="mb-4">
                  <DateRangePicker
                    portfolioCreatedDate={portfolioMinDate}
                    startDate={dateRangeStart}
                    endDate={dateRangeEnd}
                    onChange={handleDateRangeChange}
                  />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performance.historicalData.slice(-30)}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(v) => `$${v.toFixed(0)}`}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Value']}
                        labelFormatter={(date: string) => formatDate(date)}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Sector Allocation */}
            {sectorData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Sector Allocation</h2>
                <div className="flex items-center gap-6">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {sectorData.map((sector, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                        <span className="text-sm text-slate-400">{sector.name}</span>
                        <span className="text-sm font-medium text-white ml-auto">{sector.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Holdings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Holdings</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {portfolio.players.map((player) => {
              if (!player.asset) return null;
              return (
                <div key={player.positionId} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-emerald-400">{player.asset.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{player.asset.symbol}</p>
                    <p className="text-sm text-slate-500 truncate">{player.asset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{formatCurrency(player.asset.currentPrice)}</p>
                    <p className={cn('text-sm', player.asset.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {formatPercent(player.asset.dayChangePercent)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-400">{player.allocation.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
            {portfolio.players.filter((p) => p.asset).length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">
                No assets assigned yet. {isOwner ? 'Click on positions above to add assets.' : ''}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Asset Selector Modal */}
      <AssetSelector
        isOpen={!!selectedPosition}
        onClose={() => setSelectedPosition(null)}
        onSelect={handleAssetSelect}
        position={selectedPosition?.position || null}
        currentAsset={selectedPosition?.player.asset || null}
      />

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Portfolio" size="sm">
        <div className="space-y-4">
          <div className="flex gap-3">
            <a
              href={getShareUrl(portfolio.id, 'twitter')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </a>
            <a
              href={getShareUrl(portfolio.id, 'facebook')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>

          <div className="relative">
            <input
              type="text"
              value={typeof window !== 'undefined' ? window.location.href : ''}
              readOnly
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-24 text-slate-300 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Portfolio" size="sm">
        <div className="space-y-4">
          <p className="text-slate-400">Are you sure you want to delete this portfolio? This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
