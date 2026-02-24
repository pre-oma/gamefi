/**
 * Server-side utilities for calculating challenge performance
 * Used by the settlement API to determine winners
 */

import { Portfolio, ChallengeTimeframe } from '@/types';

interface HistoricalDataPoint {
  date: string;
  close: number;
}

/**
 * Fetch historical data for a stock from Yahoo Finance (server-side)
 */
async function fetchStockHistoricalDataServer(
  symbol: string,
  startDate: string,
  endDate: string,
  baseUrl: string
): Promise<HistoricalDataPoint[]> {
  try {
    const url = `${baseUrl}/api/yahoo-finance/historical?symbol=${encodeURIComponent(symbol)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

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
 * Fetch S&P 500 (SPY) return for a given date range
 */
export async function fetchSP500ReturnForPeriod(
  startDate: string,
  endDate: string,
  baseUrl: string
): Promise<number> {
  try {
    const data = await fetchStockHistoricalDataServer('SPY', startDate, endDate, baseUrl);

    if (data.length < 2) {
      // Not enough data, return average market return
      return 0;
    }

    const startPrice = data[0].close;
    const endPrice = data[data.length - 1].close;

    return ((endPrice - startPrice) / startPrice) * 100;
  } catch (error) {
    console.error('Error fetching S&P 500 return:', error);
    return 0;
  }
}

/**
 * Calculate portfolio return for a given date range using real Yahoo Finance data
 */
export async function calculatePortfolioReturnForPeriod(
  portfolio: Portfolio,
  startDate: string,
  endDate: string,
  baseUrl: string
): Promise<number> {
  // Get all stocks with allocations
  const stocks = portfolio.players
    .filter((p) => p.asset?.symbol)
    .map((p) => ({
      symbol: p.asset!.symbol,
      allocation: p.allocation / 100,
    }));

  if (stocks.length === 0) {
    return 0;
  }

  // Fetch historical data for all stocks
  const stockReturns = await Promise.all(
    stocks.map(async (stock) => {
      const data = await fetchStockHistoricalDataServer(
        stock.symbol,
        startDate,
        endDate,
        baseUrl
      );

      if (data.length < 2) {
        return { symbol: stock.symbol, allocation: stock.allocation, return: 0 };
      }

      const startPrice = data[0].close;
      const endPrice = data[data.length - 1].close;
      const returnPct = ((endPrice - startPrice) / startPrice) * 100;

      return { symbol: stock.symbol, allocation: stock.allocation, return: returnPct };
    })
  );

  // Calculate weighted return
  const totalAllocation = stockReturns.reduce((sum, s) => sum + s.allocation, 0);
  if (totalAllocation === 0) return 0;

  const weightedReturn = stockReturns.reduce(
    (sum, s) => sum + (s.return * s.allocation) / totalAllocation,
    0
  );

  return weightedReturn;
}

/**
 * Get the number of days for a timeframe
 */
export function getTimeframeDays(timeframe: ChallengeTimeframe): number {
  switch (timeframe) {
    case '1W':
      return 7;
    case '2W':
      return 14;
    case '1M':
      return 30;
    case '3M':
      return 90;
    default:
      return 7;
  }
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
