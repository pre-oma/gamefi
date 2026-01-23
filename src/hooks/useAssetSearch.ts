'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset } from '@/types';
import { getAllAssets } from '@/data/assets';
import { fetchAssetFromYahoo } from '@/lib/yahooFinance';

interface UseAssetSearchResult {
  results: Asset[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const DEBOUNCE_DELAY = 300; // ms

// Search assets by symbol only (prefix match), sorted alphabetically
function searchBySymbol(query: string): Asset[] {
  const upperQuery = query.toUpperCase();
  return getAllAssets()
    .filter(a => a.symbol.toUpperCase().startsWith(upperQuery))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

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
      // Search local assets by symbol prefix
      const localResults = searchBySymbol(normalizedTerm);

      // Check if search term has changed while we were processing
      if (latestSearchRef.current !== normalizedTerm) return;

      // Check if the search term looks like a stock symbol (letters/numbers, 1-5 chars)
      const isLikelySymbol = /^[A-Za-z0-9]{1,5}$/.test(normalizedTerm);

      // Check if we have an exact local symbol match
      const hasExactLocalMatch = localResults.some(
        a => a.symbol.toUpperCase() === normalizedTerm.toUpperCase()
      );

      // If it looks like a symbol and no exact local match, try Yahoo Finance
      if (isLikelySymbol && !hasExactLocalMatch) {
        const yahooResponse = await fetchAssetFromYahoo(normalizedTerm);

        // Check if search term has changed while we were fetching
        if (latestSearchRef.current !== normalizedTerm) return;

        if (yahooResponse.success && yahooResponse.asset) {
          // Add Yahoo result and re-sort alphabetically
          const combined = [yahooResponse.asset, ...localResults.filter(
            a => a.symbol.toUpperCase() !== yahooResponse.asset!.symbol.toUpperCase()
          )];
          combined.sort((a, b) => a.symbol.localeCompare(b.symbol));
          setResults(combined);
        } else {
          setResults(localResults);
          if (localResults.length === 0 && yahooResponse.error && yahooResponse.error !== 'Symbol not found') {
            setError(yahooResponse.error);
          }
        }
      } else {
        // Has exact local match or not a symbol-like query
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
