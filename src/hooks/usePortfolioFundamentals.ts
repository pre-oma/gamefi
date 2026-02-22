'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Portfolio, PortfolioPlayer, Asset, BenchmarkSymbol } from '@/types';
import { fetchMultipleFundamentals, AssetFundamentals } from '@/lib/yahooFundamentals';
import {
  calculateAlpha,
  calculatePortfolioAggregateMetrics,
  PortfolioAggregateMetrics,
} from '@/lib/utils';
import { fetchBenchmarkHistoricalData } from '@/lib/benchmarkData';

interface UsePortfolioFundamentalsOptions {
  enabled?: boolean;
  benchmarkSymbol?: BenchmarkSymbol;
}

interface UsePortfolioFundamentalsResult {
  enrichedPlayers: PortfolioPlayer[];
  aggregateMetrics: PortfolioAggregateMetrics;
  alpha: number | null;
  benchmarkReturn: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and calculate fundamental metrics for a portfolio
 */
export function usePortfolioFundamentals(
  portfolio: Portfolio,
  portfolioReturn: number,
  portfolioBeta: number,
  options: UsePortfolioFundamentalsOptions = {}
): UsePortfolioFundamentalsResult {
  const { enabled = true, benchmarkSymbol = 'SPY' } = options;

  // Create a stable symbols string to use as dependency
  const symbolsString = useMemo(() => {
    return portfolio.players
      .filter((p) => p.asset?.symbol)
      .map((p) => p.asset!.symbol.toUpperCase())
      .sort()
      .join(',');
  }, [portfolio.players]);

  const [fundamentalsMap, setFundamentalsMap] = useState<Map<string, AssetFundamentals>>(new Map());
  const [benchmarkReturn, setBenchmarkReturn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if we've fetched for this symbol set
  const lastFetchedSymbols = useRef<string>('');

  // Fetch fundamentals for all assets in portfolio
  useEffect(() => {
    console.log('[usePortfolioFundamentals] Effect triggered', {
      enabled,
      portfolioId: portfolio.id,
      symbolsString,
      lastFetched: lastFetchedSymbols.current,
    });

    if (!enabled) {
      console.log('[usePortfolioFundamentals] Disabled, skipping');
      setIsLoading(false);
      return;
    }

    if (!symbolsString) {
      console.log('[usePortfolioFundamentals] No symbols, skipping');
      setIsLoading(false);
      return;
    }

    // Skip if we've already fetched for these symbols
    if (lastFetchedSymbols.current === symbolsString) {
      console.log('[usePortfolioFundamentals] Already fetched for these symbols, skipping');
      return;
    }

    const symbols = symbolsString.split(',').filter(Boolean);
    console.log('[usePortfolioFundamentals] Will fetch for symbols:', symbols);

    let cancelled = false;
    lastFetchedSymbols.current = symbolsString;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log('[usePortfolioFundamentals] Fetching fundamentals for:', symbols);

      try {
        // Fetch fundamentals for portfolio assets
        const fundamentals = await fetchMultipleFundamentals(symbols);
        console.log('[usePortfolioFundamentals] Fetched fundamentals:', fundamentals.size, 'results');
        if (!cancelled) {
          setFundamentalsMap(fundamentals);
        }

        // Fetch benchmark performance for Alpha calculation
        try {
          const benchmarkData = await fetchBenchmarkHistoricalData(benchmarkSymbol, '1M');
          if (!cancelled && benchmarkData.length > 1) {
            const firstValue = benchmarkData[0].close;
            const lastValue = benchmarkData[benchmarkData.length - 1].close;
            const benchReturn = ((lastValue - firstValue) / firstValue) * 100;
            setBenchmarkReturn(benchReturn);
          }
        } catch (benchmarkError) {
          console.error('Failed to fetch benchmark data:', benchmarkError);
          // Don't fail the whole operation if benchmark fetch fails
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch fundamentals');
          console.error('Error fetching fundamentals:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [symbolsString, enabled, benchmarkSymbol]);

  // Enrich players with fundamentals data
  const enrichedPlayers = useMemo(() => {
    return portfolio.players.map((player) => {
      if (!player.asset) return player;

      const fundamentals = fundamentalsMap.get(player.asset.symbol.toUpperCase());
      if (!fundamentals) return player;

      const enrichedAsset: Asset = {
        ...player.asset,
        peRatio: fundamentals.peRatio ?? player.asset.peRatio,
        beta: fundamentals.beta ?? player.asset.beta,
        marketCap: fundamentals.marketCap ?? player.asset.marketCap,
        dividendYield: fundamentals.dividendYield ?? player.asset.dividendYield,
        sector: fundamentals.sector ?? player.asset.sector,
        eps: fundamentals.eps,
        forwardEps: fundamentals.forwardEps,
        forwardPE: fundamentals.forwardPE,
        pegRatio: fundamentals.pegRatio,
        priceToBook: fundamentals.priceToBook,
        returnOnEquity: fundamentals.returnOnEquity,
        returnOnAssets: fundamentals.returnOnAssets,
        profitMargin: fundamentals.profitMargin,
        operatingMargin: fundamentals.operatingMargin,
        grossMargin: fundamentals.grossMargin,
        debtToEquity: fundamentals.debtToEquity,
        currentRatio: fundamentals.currentRatio,
        revenueGrowth: fundamentals.revenueGrowth,
        earningsGrowth: fundamentals.earningsGrowth,
        industry: fundamentals.industry,
      };

      return { ...player, asset: enrichedAsset };
    });
  }, [portfolio.players, fundamentalsMap]);

  // Calculate aggregate metrics from enriched players
  const aggregateMetrics = useMemo(() => {
    return calculatePortfolioAggregateMetrics(enrichedPlayers);
  }, [enrichedPlayers]);

  // Calculate Alpha
  const alpha = useMemo(() => {
    if (benchmarkReturn === null) return null;
    return calculateAlpha(portfolioReturn, portfolioBeta, benchmarkReturn);
  }, [portfolioReturn, portfolioBeta, benchmarkReturn]);

  return {
    enrichedPlayers,
    aggregateMetrics,
    alpha,
    benchmarkReturn,
    isLoading,
    error,
  };
}
