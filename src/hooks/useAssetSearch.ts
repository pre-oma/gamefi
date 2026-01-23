'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset } from '@/types';
import { searchAllAssets, getAssetBySymbol } from '@/data/assets';
import { fetchAssetFromYahoo } from '@/lib/yahooFinance';

interface UseAssetSearchResult {
  results: Asset[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const DEBOUNCE_DELAY = 300; // ms

export function useAssetSearch(initialTerm: string = ''): UseAssetSearchResult {
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const [results, setResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest search to avoid race conditions
  const latestSearchRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (term: string) => {
    const normalizedTerm = term.trim();
    latestSearchRef.current = normalizedTerm;

    // Clear previous error
    setError(null);

    // If empty search, return all assets
    if (!normalizedTerm) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // First, search local assets
      const localResults = searchAllAssets(normalizedTerm);

      // Check if search term has changed while we were processing
      if (latestSearchRef.current !== normalizedTerm) return;

      // If we have local results, show them
      if (localResults.length > 0) {
        setResults(localResults);
        setIsLoading(false);
        return;
      }

      // Check if the search term looks like a stock symbol (all caps, 1-5 chars)
      const isLikelySymbol = /^[A-Za-z]{1,5}$/.test(normalizedTerm);

      // If no local results and looks like a symbol, try Yahoo Finance
      if (isLikelySymbol) {
        // First check if we already have this asset cached
        const existingAsset = getAssetBySymbol(normalizedTerm);
        if (existingAsset) {
          setResults([existingAsset]);
          setIsLoading(false);
          return;
        }

        // Try fetching from Yahoo Finance
        const yahooResponse = await fetchAssetFromYahoo(normalizedTerm);

        // Check if search term has changed while we were fetching
        if (latestSearchRef.current !== normalizedTerm) return;

        if (yahooResponse.success && yahooResponse.asset) {
          setResults([yahooResponse.asset]);
        } else {
          setResults([]);
          if (yahooResponse.error && yahooResponse.error !== 'Symbol not found') {
            setError(yahooResponse.error);
          }
        }
      } else {
        // Not a symbol-like search, just show no results
        setResults([]);
      }
    } catch (err) {
      if (latestSearchRef.current === normalizedTerm) {
        setError('Failed to search assets');
        setResults([]);
      }
    } finally {
      if (latestSearchRef.current === normalizedTerm) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  return {
    results,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
  };
}
