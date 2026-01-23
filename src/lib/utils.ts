import { Portfolio, PortfolioPerformance, Asset, LeaderboardEntry, User } from '@/types';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { portfolioStorage, userStorage } from './storage';

export const cn = (...classes: (string | boolean | undefined | null | number)[]): string => {
  return classes.filter((c) => typeof c === 'string' && c.length > 0).join(' ');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

export const formatPercent = (value: number, showSign = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

// Calculate portfolio value based on current asset prices
export const calculatePortfolioValue = (portfolio: Portfolio, initialInvestment = 10000): number => {
  const filledPlayers = portfolio.players.filter((p) => p.asset !== null);
  if (filledPlayers.length === 0) return initialInvestment;

  let totalValue = 0;
  const allocationPerPlayer = 100 / 11;

  portfolio.players.forEach((player) => {
    if (player.asset) {
      const investmentAmount = (initialInvestment * allocationPerPlayer) / 100;
      // Simulate some return based on day change
      const returnMultiplier = 1 + (player.asset.dayChangePercent / 100) * (Math.random() * 2 + 0.5);
      totalValue += investmentAmount * returnMultiplier;
    } else {
      totalValue += (initialInvestment * allocationPerPlayer) / 100;
    }
  });

  return totalValue;
};

// Generate mock historical data for a portfolio
export const generatePortfolioHistory = (
  portfolio: Portfolio,
  days?: number
): { date: string; value: number }[] => {
  const history: { date: string; value: number }[] = [];
  let value = 10000;

  // Calculate days since portfolio creation
  const createdDate = new Date(portfolio.createdAt);
  const today = new Date();
  const daysSinceCreation = Math.max(0, Math.floor((today.getTime() - createdDate.getTime()) / 86400000));

  // Use the lesser of requested days or days since creation (max 365)
  const actualDays = days !== undefined
    ? Math.min(days, daysSinceCreation, 365)
    : Math.min(daysSinceCreation, 365);

  // Handle portfolios created today
  if (actualDays === 0) {
    return [{
      date: format(today, 'yyyy-MM-dd'),
      value: 10000,
    }];
  }

  for (let i = actualDays; i >= 0; i--) {
    const date = subDays(new Date(), i);
    // Random daily change between -3% and +3%
    const dailyChange = (Math.random() - 0.48) * 0.06;
    value = value * (1 + dailyChange);
    history.push({
      date: format(date, 'yyyy-MM-dd'),
      value: Math.round(value * 100) / 100,
    });
  }

  return history;
};

// Calculate portfolio performance metrics
export const calculatePortfolioPerformance = (portfolio: Portfolio): PortfolioPerformance => {
  const history = generatePortfolioHistory(portfolio);
  const currentValue = history[history.length - 1].value;
  const initialValue = 10000;

  const dayAgoValue = history[history.length - 2]?.value || initialValue;
  const twoDaysAgoValue = history[history.length - 3]?.value || initialValue;
  const weekAgoValue = history[history.length - 8]?.value || initialValue;
  const twoWeeksAgoValue = history[history.length - 15]?.value || initialValue;
  const monthAgoValue = history[history.length - 31]?.value || initialValue;
  const yearAgoValue = history[0]?.value || initialValue;

  // Calculate beta (simplified - average of asset betas)
  const assetsWithBeta = portfolio.players.filter((p) => p.asset?.beta).map((p) => p.asset!.beta);
  const avgBeta = assetsWithBeta.length > 0
    ? assetsWithBeta.reduce((a, b) => a + b, 0) / assetsWithBeta.length
    : 1;

  // Calculate volatility (standard deviation of daily returns)
  const dailyReturns = history.length > 1
    ? history.slice(1).map((h, i) => (h.value - history[i].value) / history[i].value)
    : [0];
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

  // Simplified Sharpe ratio (assuming risk-free rate of 4%)
  const annualReturn = ((currentValue - initialValue) / initialValue) * 100;
  const sharpeRatio = volatility > 0 ? (annualReturn - 4) / volatility : 0;

  // Max drawdown
  let maxDrawdown = 0;
  let peak = history[0].value;
  for (const point of history) {
    if (point.value > peak) peak = point.value;
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Win rate (days with positive returns)
  const winDays = dailyReturns.filter((r) => r > 0).length;
  const winRate = dailyReturns.length > 0 ? (winDays / dailyReturns.length) * 100 : 0;

  // Day-over-day comparison calculations
  const todayChange = ((currentValue - dayAgoValue) / dayAgoValue) * 100;
  const yesterdayChange = ((dayAgoValue - twoDaysAgoValue) / twoDaysAgoValue) * 100;
  const dayVsPreviousDay = todayChange - yesterdayChange;

  const thisWeekChange = ((currentValue - weekAgoValue) / weekAgoValue) * 100;
  const lastWeekChange = ((weekAgoValue - twoWeeksAgoValue) / twoWeeksAgoValue) * 100;
  const weekVsPreviousWeek = thisWeekChange - lastWeekChange;

  const isImproving = dayVsPreviousDay > 0;

  return {
    portfolioId: portfolio.id,
    totalValue: currentValue,
    totalReturn: currentValue - initialValue,
    totalReturnPercent: ((currentValue - initialValue) / initialValue) * 100,
    dayReturn: currentValue - dayAgoValue,
    dayReturnPercent: ((currentValue - dayAgoValue) / dayAgoValue) * 100,
    weekReturn: currentValue - weekAgoValue,
    weekReturnPercent: ((currentValue - weekAgoValue) / weekAgoValue) * 100,
    monthReturn: currentValue - monthAgoValue,
    monthReturnPercent: ((currentValue - monthAgoValue) / monthAgoValue) * 100,
    yearReturn: currentValue - yearAgoValue,
    yearReturnPercent: ((currentValue - yearAgoValue) / yearAgoValue) * 100,
    beta: avgBeta,
    sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
    volatility: isNaN(volatility) ? 0 : volatility,
    maxDrawdown: maxDrawdown * 100,
    winRate: isNaN(winRate) ? 0 : winRate,
    historicalData: history.map((h) => ({
      date: h.date,
      value: h.value,
      return: ((h.value - initialValue) / initialValue) * 100,
    })),
    // Day-over-day comparison fields
    dayVsPreviousDay: isNaN(dayVsPreviousDay) ? 0 : dayVsPreviousDay,
    weekVsPreviousWeek: isNaN(weekVsPreviousWeek) ? 0 : weekVsPreviousWeek,
    isImproving,
  };
};

// Get leaderboard entries
export const getLeaderboardEntries = (
  period: 'day' | 'week' | 'month' | 'year' | 'all' = 'month',
  limit: number = 20
): LeaderboardEntry[] => {
  const publicPortfolios = portfolioStorage.getPublic();

  const entries: LeaderboardEntry[] = publicPortfolios.map((portfolio) => {
    const user = userStorage.getUserById(portfolio.userId);
    const performance = calculatePortfolioPerformance(portfolio);

    let returnPercent: number;
    switch (period) {
      case 'day':
        returnPercent = performance.dayReturnPercent;
        break;
      case 'week':
        returnPercent = performance.weekReturnPercent;
        break;
      case 'month':
        returnPercent = performance.monthReturnPercent;
        break;
      case 'year':
        returnPercent = performance.yearReturnPercent;
        break;
      default:
        returnPercent = performance.totalReturnPercent;
    }

    return {
      rank: 0,
      userId: portfolio.userId,
      username: user?.username || 'Unknown',
      avatar: user?.avatar || '',
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      formation: portfolio.formation,
      value: performance.totalValue,
      returnPercent,
      followers: user?.followers.length || 0,
    };
  });

  // Sort by return and assign ranks
  entries.sort((a, b) => b.returnPercent - a.returnPercent);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries.slice(0, limit);
};

// Social share URLs
export const getShareUrl = (portfolioId: string, platform: 'twitter' | 'facebook' | 'linkedin'): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gamefi.demo';
  const portfolioUrl = `${baseUrl}/portfolio/${portfolioId}`;
  const text = encodeURIComponent('Check out my investment portfolio on Gamefi Invest!');

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(portfolioUrl)}&text=${text}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(portfolioUrl)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`;
    default:
      return portfolioUrl;
  }
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Export portfolio to CSV
export const exportPortfolioToCSV = (portfolio: Portfolio, performance: PortfolioPerformance): void => {
  const rows = [
    ['Position', 'Asset', 'Symbol', 'Allocation', 'Current Price', 'Day Change'],
    ...portfolio.players.map((player) => [
      player.positionId,
      player.asset?.name || 'Empty',
      player.asset?.symbol || '-',
      `${(player.allocation).toFixed(2)}%`,
      player.asset ? formatCurrency(player.asset.currentPrice) : '-',
      player.asset ? formatPercent(player.asset.dayChangePercent) : '-',
    ]),
    [],
    ['Performance Metrics'],
    ['Total Value', formatCurrency(performance.totalValue)],
    ['Total Return', formatPercent(performance.totalReturnPercent)],
    ['Day Return', formatPercent(performance.dayReturnPercent)],
    ['Month Return', formatPercent(performance.monthReturnPercent)],
    ['Beta', performance.beta.toFixed(2)],
    ['Sharpe Ratio', performance.sharpeRatio.toFixed(2)],
    ['Volatility', `${performance.volatility.toFixed(2)}%`],
  ];

  const csvContent = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${portfolio.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Level calculation from XP
export const calculateLevel = (xp: number): { level: number; currentXp: number; nextLevelXp: number } => {
  // XP required doubles each level: 100, 200, 400, 800...
  let level = 1;
  let totalXpRequired = 100;
  let previousTotal = 0;

  while (xp >= totalXpRequired) {
    previousTotal = totalXpRequired;
    totalXpRequired += 100 * Math.pow(2, level);
    level++;
  }

  return {
    level,
    currentXp: xp - previousTotal,
    nextLevelXp: totalXpRequired - previousTotal,
  };
};
