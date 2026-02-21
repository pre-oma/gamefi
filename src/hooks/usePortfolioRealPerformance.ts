'use client';

import { useState, useEffect } from 'react';
import { Portfolio, PortfolioPerformance, PortfolioHistoricalPoint, CustomDateRange } from '@/types';
import { calculatePortfolioPerformance } from '@/lib/utils';
import {
  calculatePortfolioHistoricalData,
  calculateMetricsFromHistoricalData,
} from '@/lib/portfolioHistoricalData';
import { format } from 'date-fns';

/**
 * Calculate real portfolio value from historical data
 * Uses the last point in historical data (normalized to 100) to calculate actual value
 */
function calculateRealValueFromHistoricalData(
  historicalData: PortfolioHistoricalPoint[],
  initialInvestment: number = 10000
): number {
  if (historicalData.length === 0) {
    return initialInvestment;
  }

  // Historical data is normalized to start at 100
  // The last value represents the current normalized portfolio value
  const lastNormalizedValue = historicalData[historicalData.length - 1].value;

  // Convert normalized value to actual dollar value
  // If normalized = 105, that means 5% gain, so real value = initial * 1.05
  return initialInvestment * (lastNormalizedValue / 100);
}

interface UsePortfolioRealPerformanceOptions {
  timeframe?: '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD';
  useCreationDate?: boolean; // Calculate from portfolio creation date
  enabled?: boolean;
}

interface UsePortfolioRealPerformanceResult {
  performance: PortfolioPerformance;
  historicalData: PortfolioHistoricalPoint[];
  isLoading: boolean;
  isRealData: boolean;
}

/**
 * Hook to fetch real performance data for a portfolio from Yahoo Finance
 * Falls back to mock data while loading or if fetch fails
 * When useCreationDate is true, calculates performance from portfolio creation date
 */
export function usePortfolioRealPerformance(
  portfolio: Portfolio,
  options: UsePortfolioRealPerformanceOptions = {}
): UsePortfolioRealPerformanceResult {
  const { timeframe = '1M', useCreationDate = true, enabled = true } = options;

  // Start with mock performance data
  const [performance, setPerformance] = useState<PortfolioPerformance>(() =>
    calculatePortfolioPerformance(portfolio)
  );
  const [historicalData, setHistoricalData] = useState<PortfolioHistoricalPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Check if portfolio has any stocks
    const hasStocks = portfolio.players.some((p) => p.asset?.symbol);
    if (!hasStocks) {
      setIsLoading(false);
      setIsRealData(false);
      return;
    }

    let cancelled = false;

    const fetchRealData = async () => {
      setIsLoading(true);
      const initialInvestment = 10000;

      try {
        // Determine date range based on creation date or timeframe
        let dateRange: CustomDateRange | null = null;

        if (useCreationDate && portfolio.createdAt) {
          const creationDate = new Date(portfolio.createdAt);
          const today = new Date();
          dateRange = {
            startDate: format(creationDate, 'yyyy-MM-dd'),
            endDate: format(today, 'yyyy-MM-dd'),
          };
        }

        const realHistoricalData = await calculatePortfolioHistoricalData(
          portfolio,
          timeframe,
          dateRange
        );

        if (cancelled) return;

        if (realHistoricalData.length > 0) {
          // Calculate real value from historical data
          const realValue = calculateRealValueFromHistoricalData(realHistoricalData, initialInvestment);
          const realTotalReturn = realValue - initialInvestment;
          const realTotalReturnPercent = ((realValue - initialInvestment) / initialInvestment) * 100;

          // Calculate additional metrics if we have enough data
          let volatility = 0;
          let sharpeRatio = 0;
          let maxDrawdown = 0;

          if (realHistoricalData.length > 1) {
            const realMetrics = calculateMetricsFromHistoricalData(realHistoricalData);
            volatility = realMetrics.volatility;
            sharpeRatio = realMetrics.sharpeRatio;
            maxDrawdown = realMetrics.maxDrawdown;
          }

          // Merge real metrics with base performance
          const basePerformance = calculatePortfolioPerformance(portfolio);
          setPerformance({
            ...basePerformance,
            totalValue: realValue,
            totalReturn: realTotalReturn,
            totalReturnPercent: realTotalReturnPercent,
            volatility,
            sharpeRatio,
            maxDrawdown,
            historicalData: realHistoricalData,
          });
          setHistoricalData(realHistoricalData);
          setIsRealData(true);
        } else {
          // No historical data available, keep mock data
          setIsRealData(false);
        }
      } catch (error) {
        console.error('Failed to fetch real portfolio performance:', error);
        setIsRealData(false);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRealData();

    return () => {
      cancelled = true;
    };
  }, [portfolio.id, portfolio.players, portfolio.createdAt, timeframe, useCreationDate, enabled]);

  return { performance, historicalData, isLoading, isRealData };
}

/**
 * Fetch real performance for multiple portfolios
 * Uses each portfolio's creation date for calculating returns
 */
export async function fetchMultiplePortfolioPerformances(
  portfolios: Portfolio[],
  timeframe: '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' = '1M',
  useCreationDate: boolean = true
): Promise<Map<string, { performance: PortfolioPerformance; isRealData: boolean }>> {
  const results = new Map<string, { performance: PortfolioPerformance; isRealData: boolean }>();
  const initialInvestment = 10000;

  await Promise.all(
    portfolios.map(async (portfolio) => {
      const hasStocks = portfolio.players.some((p) => p.asset?.symbol);
      const basePerformance = calculatePortfolioPerformance(portfolio);

      if (!hasStocks) {
        results.set(portfolio.id, { performance: basePerformance, isRealData: false });
        return;
      }

      try {
        // Calculate date range from creation date
        let dateRange: CustomDateRange | null = null;

        if (useCreationDate && portfolio.createdAt) {
          const creationDate = new Date(portfolio.createdAt);
          const today = new Date();
          dateRange = {
            startDate: format(creationDate, 'yyyy-MM-dd'),
            endDate: format(today, 'yyyy-MM-dd'),
          };
        }

        const realHistoricalData = await calculatePortfolioHistoricalData(
          portfolio,
          timeframe,
          dateRange
        );

        if (realHistoricalData.length > 0) {
          // Calculate real value from historical data
          const realValue = calculateRealValueFromHistoricalData(realHistoricalData, initialInvestment);
          const realTotalReturn = realValue - initialInvestment;
          const realTotalReturnPercent = ((realValue - initialInvestment) / initialInvestment) * 100;

          // Calculate additional metrics if we have enough data
          let volatility = 0;
          let sharpeRatio = 0;
          let maxDrawdown = 0;

          if (realHistoricalData.length > 1) {
            const realMetrics = calculateMetricsFromHistoricalData(realHistoricalData);
            volatility = realMetrics.volatility;
            sharpeRatio = realMetrics.sharpeRatio;
            maxDrawdown = realMetrics.maxDrawdown;
          }

          results.set(portfolio.id, {
            performance: {
              ...basePerformance,
              totalValue: realValue,
              totalReturn: realTotalReturn,
              totalReturnPercent: realTotalReturnPercent,
              volatility,
              sharpeRatio,
              maxDrawdown,
              historicalData: realHistoricalData,
            },
            isRealData: true,
          });
        } else {
          // No historical data available
          results.set(portfolio.id, { performance: basePerformance, isRealData: false });
        }
      } catch (error) {
        console.error(`Failed to fetch performance for portfolio ${portfolio.id}:`, error);
        results.set(portfolio.id, { performance: basePerformance, isRealData: false });
      }
    })
  );

  return results;
}
