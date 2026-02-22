'use client';

import { Asset } from '@/types';

export interface AssetFundamentals {
  symbol: string;
  peRatio: number | null;
  forwardPE: number | null;
  eps: number | null;
  forwardEps: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  beta: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  sector: string | null;
  industry: string | null;
  fetchedAt: number;
}

interface FundamentalsResponse {
  success: boolean;
  fundamentals?: AssetFundamentals;
  error?: string;
}

// In-memory cache (5-minute expiration)
const CACHE_DURATION = 5 * 60 * 1000;
const memoryCache: Map<string, { data: AssetFundamentals; timestamp: number }> = new Map();
const pendingRequests: Map<string, Promise<FundamentalsResponse>> = new Map();

/**
 * Fetch fundamentals for a single symbol
 */
export async function fetchFundamentals(symbol: string): Promise<FundamentalsResponse> {
  const upperSymbol = symbol.toUpperCase();

  // Check memory cache
  const cached = memoryCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { success: true, fundamentals: cached.data };
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(upperSymbol);
  if (pending) {
    return pending;
  }

  // Create new request
  const requestPromise = (async (): Promise<FundamentalsResponse> => {
    try {
      console.log('[yahooFundamentals] Fetching:', upperSymbol);
      const response = await fetch(`/api/yahoo-finance/fundamentals?symbol=${encodeURIComponent(upperSymbol)}`);
      const data = await response.json();
      console.log('[yahooFundamentals] Response for', upperSymbol, ':', data.success ? 'success' : data.error);

      if (data.success && data.fundamentals) {
        const fundamentals: AssetFundamentals = {
          ...data.fundamentals,
          fetchedAt: Date.now(),
        };

        // Cache the result
        memoryCache.set(upperSymbol, { data: fundamentals, timestamp: Date.now() });

        return { success: true, fundamentals };
      }

      return { success: false, error: data.error || 'Failed to fetch fundamentals' };
    } catch (error) {
      console.error(`Failed to fetch fundamentals for ${upperSymbol}:`, error);
      return { success: false, error: 'Network error' };
    } finally {
      pendingRequests.delete(upperSymbol);
    }
  })();

  pendingRequests.set(upperSymbol, requestPromise);
  return requestPromise;
}

/**
 * Fetch fundamentals for multiple symbols in parallel
 */
export async function fetchMultipleFundamentals(
  symbols: string[]
): Promise<Map<string, AssetFundamentals>> {
  const results = new Map<string, AssetFundamentals>();
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];

  const promises = uniqueSymbols.map(async (symbol) => {
    const result = await fetchFundamentals(symbol);
    if (result.success && result.fundamentals) {
      results.set(symbol, result.fundamentals);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Enrich an Asset with fundamental data
 */
export async function enrichAssetWithFundamentals(asset: Asset): Promise<Asset> {
  const result = await fetchFundamentals(asset.symbol);

  if (result.success && result.fundamentals) {
    const f = result.fundamentals;
    return {
      ...asset,
      // Update with real fundamentals
      peRatio: f.peRatio ?? asset.peRatio,
      beta: f.beta ?? asset.beta,
      marketCap: f.marketCap ?? asset.marketCap,
      dividendYield: f.dividendYield ?? asset.dividendYield,
      sector: f.sector ?? asset.sector,
      // New fields
      eps: f.eps,
      forwardEps: f.forwardEps,
      forwardPE: f.forwardPE,
      pegRatio: f.pegRatio,
      priceToBook: f.priceToBook,
      returnOnEquity: f.returnOnEquity,
      returnOnAssets: f.returnOnAssets,
      profitMargin: f.profitMargin,
      operatingMargin: f.operatingMargin,
      grossMargin: f.grossMargin,
      debtToEquity: f.debtToEquity,
      currentRatio: f.currentRatio,
      revenueGrowth: f.revenueGrowth,
      earningsGrowth: f.earningsGrowth,
      industry: f.industry,
    };
  }

  return asset;
}

/**
 * Enrich multiple assets with fundamental data
 */
export async function enrichAssetsWithFundamentals(assets: Asset[]): Promise<Asset[]> {
  const symbols = assets.filter((a) => a.symbol).map((a) => a.symbol);
  const fundamentalsMap = await fetchMultipleFundamentals(symbols);

  return assets.map((asset) => {
    const f = fundamentalsMap.get(asset.symbol.toUpperCase());
    if (f) {
      return {
        ...asset,
        peRatio: f.peRatio ?? asset.peRatio,
        beta: f.beta ?? asset.beta,
        marketCap: f.marketCap ?? asset.marketCap,
        dividendYield: f.dividendYield ?? asset.dividendYield,
        sector: f.sector ?? asset.sector,
        eps: f.eps,
        forwardEps: f.forwardEps,
        forwardPE: f.forwardPE,
        pegRatio: f.pegRatio,
        priceToBook: f.priceToBook,
        returnOnEquity: f.returnOnEquity,
        returnOnAssets: f.returnOnAssets,
        profitMargin: f.profitMargin,
        operatingMargin: f.operatingMargin,
        grossMargin: f.grossMargin,
        debtToEquity: f.debtToEquity,
        currentRatio: f.currentRatio,
        revenueGrowth: f.revenueGrowth,
        earningsGrowth: f.earningsGrowth,
        industry: f.industry,
      };
    }
    return asset;
  });
}

/**
 * Clear the fundamentals cache
 */
export function clearFundamentalsCache(): void {
  memoryCache.clear();
}
