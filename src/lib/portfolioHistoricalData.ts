import { Portfolio, PortfolioHistoricalPoint, ComparisonTimeframe, CustomDateRange } from '@/types';
import { format, subDays, subMonths, subWeeks, subYears, startOfYear } from 'date-fns';

interface StockHistoricalData {
  symbol: string;
  data: { date: string; close: number }[];
}

/**
 * Fetch historical data for a single stock from Yahoo Finance
 */
async function fetchStockHistoricalData(
  symbol: string,
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<{ date: string; close: number }[]> {
  try {
    let url = `/api/yahoo-finance/historical?symbol=${encodeURIComponent(symbol)}`;

    if (dateRange) {
      url += `&startDate=${encodeURIComponent(dateRange.startDate)}&endDate=${encodeURIComponent(dateRange.endDate)}`;
    } else {
      url += `&timeframe=${encodeURIComponent(timeframe)}`;
    }

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.success || !data.data) return [];

    return data.data.map((point: { date: string; close: number }) => ({
      date: point.date,
      close: point.close,
    }));
  } catch (error) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Calculate portfolio historical performance using real stock data
 * Returns normalized values (starting at 100) for each date
 */
export async function calculatePortfolioHistoricalData(
  portfolio: Portfolio,
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<PortfolioHistoricalPoint[]> {
  // Get all unique stock symbols from portfolio
  const stocks = portfolio.players
    .filter((p) => p.asset?.symbol)
    .map((p) => ({
      symbol: p.asset!.symbol,
      allocation: p.allocation / 100, // Convert to decimal
    }));

  if (stocks.length === 0) {
    return [];
  }

  // Fetch historical data for all stocks in parallel
  const stockDataPromises = stocks.map(async (stock) => ({
    symbol: stock.symbol,
    allocation: stock.allocation,
    data: await fetchStockHistoricalData(stock.symbol, timeframe, dateRange),
  }));

  const stocksData = await Promise.all(stockDataPromises);

  // Filter out stocks with no data
  const validStocksData = stocksData.filter((s) => s.data.length > 0);

  if (validStocksData.length === 0) {
    return [];
  }

  // Get all unique dates across all stocks
  const allDates = new Set<string>();
  validStocksData.forEach((stock) => {
    stock.data.forEach((point) => allDates.add(point.date));
  });
  const sortedDates = Array.from(allDates).sort();

  if (sortedDates.length === 0) {
    return [];
  }

  // Calculate normalized returns for each stock (starting at 100)
  const stockNormalizedData: Map<string, Map<string, number>> = new Map();

  validStocksData.forEach((stock) => {
    const dateMap = new Map<string, number>();
    if (stock.data.length > 0) {
      const firstPrice = stock.data[0].close;
      stock.data.forEach((point) => {
        // Normalize to 100
        dateMap.set(point.date, (point.close / firstPrice) * 100);
      });
    }
    stockNormalizedData.set(stock.symbol, dateMap);
  });

  // Calculate weighted portfolio value for each date
  const portfolioHistory: PortfolioHistoricalPoint[] = [];
  const totalAllocation = validStocksData.reduce((sum, s) => sum + s.allocation, 0);

  // Normalize allocations to sum to 1
  const normalizedAllocations = validStocksData.map((s) => ({
    symbol: s.symbol,
    allocation: s.allocation / totalAllocation,
  }));

  sortedDates.forEach((date) => {
    let weightedValue = 0;
    let hasAllData = true;

    normalizedAllocations.forEach((stock) => {
      const stockData = stockNormalizedData.get(stock.symbol);
      const value = stockData?.get(date);

      if (value !== undefined) {
        weightedValue += value * stock.allocation;
      } else {
        hasAllData = false;
      }
    });

    // Only include dates where we have data for all stocks
    if (hasAllData && weightedValue > 0) {
      portfolioHistory.push({
        date,
        value: weightedValue,
        return: weightedValue - 100, // Return relative to starting value of 100
      });
    }
  });

  return portfolioHistory;
}

/**
 * Get the start date for a given timeframe
 */
export function getStartDateForTimeframe(timeframe: ComparisonTimeframe): Date {
  const today = new Date();

  switch (timeframe) {
    case '1W':
      return subWeeks(today, 1);
    case '1M':
      return subMonths(today, 1);
    case '3M':
      return subMonths(today, 3);
    case '6M':
      return subMonths(today, 6);
    case '1Y':
      return subYears(today, 1);
    case 'YTD':
      return startOfYear(today);
    default:
      return subMonths(today, 1);
  }
}

/**
 * Determine if a date is before the portfolio creation date
 */
export function isBeforeCreation(date: string, createdAt: string): boolean {
  const dateObj = new Date(date);
  const createdObj = new Date(createdAt.split('T')[0]);
  return dateObj < createdObj;
}

/**
 * Calculate performance metrics from historical data
 */
export function calculateMetricsFromHistoricalData(
  historicalData: PortfolioHistoricalPoint[]
): {
  totalReturnPercent: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
} {
  if (historicalData.length < 2) {
    return {
      totalReturnPercent: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
    };
  }

  const firstValue = historicalData[0].value;
  const lastValue = historicalData[historicalData.length - 1].value;
  const totalReturnPercent = ((lastValue - firstValue) / firstValue) * 100;

  // Calculate daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prevValue = historicalData[i - 1].value;
    const currValue = historicalData[i].value;
    if (prevValue > 0) {
      dailyReturns.push((currValue - prevValue) / prevValue);
    }
  }

  // Volatility (annualized)
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (dailyReturns.length - 1 || 1);
  const dailyVolatility = Math.sqrt(variance);
  const volatility = dailyVolatility * Math.sqrt(252) * 100;

  // Sharpe ratio (assuming 4% risk-free rate)
  const riskFreeRate = 0.04;
  const annualizedReturn = avgReturn * 252;
  const sharpeRatio = (annualizedReturn - riskFreeRate) / (dailyVolatility * Math.sqrt(252) || 1);

  // Max drawdown
  let maxDrawdown = 0;
  let peak = historicalData[0].value;
  for (const point of historicalData) {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalReturnPercent: isNaN(totalReturnPercent) ? 0 : totalReturnPercent,
    volatility: isNaN(volatility) ? 0 : volatility,
    sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
    maxDrawdown: isNaN(maxDrawdown) ? 0 : maxDrawdown,
  };
}
