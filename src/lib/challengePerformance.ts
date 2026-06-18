/**
 * Server-side utilities for calculating challenge performance.
 * Used by the settlement API and the live-returns endpoint to compute
 * portfolio / benchmark returns for a given date range.
 *
 * IMPORTANT: This calls fetchYahooHistorical directly (no HTTP hop
 * through /api/yahoo-finance/historical). Earlier versions used a
 * `${baseUrl}/api/...` fetch which broke on Vercel preview deployments
 * because the server-side fetch had no SSO cookie and got 401-walled,
 * silently returning 0% for every challenge. The direct-call approach
 * also avoids the latency of a second hop.
 */

import { Portfolio, ChallengeTimeframe } from '@/types';
import { fetchYahooHistorical } from '@/lib/yahooHistorical';

/**
 * Fetch any single-ticker benchmark return for a given date range —
 * used both for S&P (SPY) and arbitrary ETF challenges (QQQ, VTI, etc).
 */
export async function fetchBenchmarkReturnForPeriod(
  symbol: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  try {
    const result = await fetchYahooHistorical({
      symbol,
      startDate,
      endDate,
    });

    if (!result.ok || result.data.length < 2) {
      return 0;
    }

    const startPrice = result.data[0].close;
    const endPrice = result.data[result.data.length - 1].close;
    if (startPrice === 0) return 0;

    return ((endPrice - startPrice) / startPrice) * 100;
  } catch (error) {
    console.error(`Error fetching ${symbol} return:`, error);
    return 0;
  }
}

/**
 * Fetch S&P 500 (SPY) return for a given date range.
 * Thin wrapper around fetchBenchmarkReturnForPeriod for backwards
 * compatibility — callers that hardcode SPY can keep their import.
 */
export async function fetchSP500ReturnForPeriod(
  startDate: string,
  endDate: string,
): Promise<number> {
  return fetchBenchmarkReturnForPeriod('SPY', startDate, endDate);
}

/**
 * Calculate weighted portfolio return for a given date range using
 * real Yahoo Finance data. Skips any holding whose Yahoo data comes
 * back empty so a single broken ticker doesn't zero the whole result.
 */
export async function calculatePortfolioReturnForPeriod(
  portfolio: Portfolio,
  startDate: string,
  endDate: string,
): Promise<number> {
  const stocks = portfolio.players
    .filter((p) => p.asset?.symbol)
    .map((p) => ({
      symbol: p.asset!.symbol,
      allocation: p.allocation / 100,
    }));

  if (stocks.length === 0) {
    return 0;
  }

  const stockReturns = await Promise.all(
    stocks.map(async (stock) => {
      const result = await fetchYahooHistorical({
        symbol: stock.symbol,
        startDate,
        endDate,
      });

      if (!result.ok || result.data.length < 2) {
        return { symbol: stock.symbol, allocation: stock.allocation, return: 0 };
      }

      const startPrice = result.data[0].close;
      const endPrice = result.data[result.data.length - 1].close;
      if (startPrice === 0) {
        return { symbol: stock.symbol, allocation: stock.allocation, return: 0 };
      }
      const returnPct = ((endPrice - startPrice) / startPrice) * 100;

      return { symbol: stock.symbol, allocation: stock.allocation, return: returnPct };
    }),
  );

  const totalAllocation = stockReturns.reduce((sum, s) => sum + s.allocation, 0);
  if (totalAllocation === 0) return 0;

  const weightedReturn = stockReturns.reduce(
    (sum, s) => sum + (s.return * s.allocation) / totalAllocation,
    0,
  );

  return weightedReturn;
}

/**
 * Get the number of days for a timeframe shorthand.
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
 * Format Date → YYYY-MM-DD.
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
