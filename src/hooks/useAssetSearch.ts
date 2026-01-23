'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset } from '@/types';
import { searchAllAssets, getAssetBySymbolFromAll } from '@/data/assets';
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

    // If empty search, return empty results
    if (!normalizedTerm) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Check if the search term looks like a stock symbol (letters only, 1-5 chars)
      const isLikelySymbol = /^[A-Za-z]{1,5}$/.test(normalizedTerm);

      // First, check for exact symbol match locally
      const exactLocalMatch = getAssetBySymbolFromAll(normalizedTerm);

      // Search local assets for partial matches
      const localResults = searchAllAssets(normalizedTerm);

      // Check if search term has changed while we were processing
      if (latestSearchRef.current !== normalizedTerm) return;

      // If we have an exact local symbol match, prioritize it
      if (exactLocalMatch) {
        // Put exact match first, then other local results (excluding the exact match)
        const otherResults = localResults.filter(a => a.id !== exactLocalMatch.id);
        setResults([exactLocalMatch, ...otherResults]);
        setIsLoading(false);
        return;
      }

      // If it looks like a symbol and no exact local match, try Yahoo Finance
      if (isLikelySymbol) {
        const yahooResponse = await fetchAssetFromYahoo(normalizedTerm);

        // Check if search term has changed while we were fetching
        if (latestSearchRef.current !== normalizedTerm) return;

        if (yahooResponse.success && yahooResponse.asset) {
          // Combine Yahoo result with local partial matches
          // Put Yahoo result first since it's an exact symbol match
          const otherResults = localResults.filter(
            a => a.symbol.toUpperCase() !== yahooResponse.asset!.symbol.toUpperCase()
          );
          setResults([yahooResponse.asset, ...otherResults]);
        } else {
          // Yahoo didn't find anything, show local partial matches
          setResults(localResults);
          if (localResults.length === 0 && yahooResponse.error && yahooResponse.error !== 'Symbol not found') {
            setError(yahooResponse.error);
          }
        }
      } else {
        // Not a symbol-like search, just show local results
        setResults(localResults);
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
