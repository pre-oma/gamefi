import { Asset } from '@/types';

interface YahooFinanceResponse {
  success: boolean;
  asset?: Asset;
  error?: string;
}

interface CacheEntry {
  asset: Asset;
  timestamp: number;
}

// In-memory cache with 5-minute expiration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const memoryCache: Map<string, CacheEntry> = new Map();

// Pending requests to prevent duplicate API calls
const pendingRequests: Map<string, Promise<YahooFinanceResponse>> = new Map();

// LocalStorage key for session persistence
const STORAGE_KEY = 'gamefi-yahoo-cache';

function getFromLocalStorage(symbol: string): Asset | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const cache: Record<string, CacheEntry> = JSON.parse(stored);
    const entry = cache[symbol.toUpperCase()];

    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.asset;
    }
  } catch {
    // Ignore parsing errors
  }

  return null;
}

function saveToLocalStorage(symbol: string, asset: Asset): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const cache: Record<string, CacheEntry> = stored ? JSON.parse(stored) : {};

    cache[symbol.toUpperCase()] = {
      asset,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

function getFromMemoryCache(symbol: string): Asset | null {
  const entry = memoryCache.get(symbol.toUpperCase());

  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.asset;
  }

  // Clean up expired entry
  if (entry) {
    memoryCache.delete(symbol.toUpperCase());
  }

  return null;
}

function saveToMemoryCache(symbol: string, asset: Asset): void {
  memoryCache.set(symbol.toUpperCase(), {
    asset,
    timestamp: Date.now(),
  });
}

export async function fetchAssetFromYahoo(symbol: string): Promise<YahooFinanceResponse> {
  const normalizedSymbol = symbol.toUpperCase();

  // Check memory cache first
  const memoryCached = getFromMemoryCache(normalizedSymbol);
  if (memoryCached) {
    return { success: true, asset: memoryCached };
  }

  // Check localStorage cache
  const localCached = getFromLocalStorage(normalizedSymbol);
  if (localCached) {
    // Also save to memory cache for faster access
    saveToMemoryCache(normalizedSymbol, localCached);
    return { success: true, asset: localCached };
  }

  // Check if there's already a pending request for this symbol
  const pending = pendingRequests.get(normalizedSymbol);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = (async (): Promise<YahooFinanceResponse> => {
    try {
      const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(normalizedSymbol)}`);
      const data: YahooFinanceResponse = await response.json();

      if (data.success && data.asset) {
        // Cache the result
        saveToMemoryCache(normalizedSymbol, data.asset);
        saveToLocalStorage(normalizedSymbol, data.asset);
      }

      return data;
    } catch (error) {
      console.error('Error fetching from Yahoo Finance:', error);
      return { success: false, error: 'Network error' };
    } finally {
      // Clean up pending request
      pendingRequests.delete(normalizedSymbol);
    }
  })();

  // Store the pending request
  pendingRequests.set(normalizedSymbol, request);

  return request;
}

// Clear all cached data
export function clearYahooCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Get all cached assets (from localStorage)
export function getCachedAssets(): Asset[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const cache: Record<string, CacheEntry> = JSON.parse(stored);
    const now = Date.now();

    return Object.values(cache)
      .filter(entry => now - entry.timestamp < CACHE_DURATION)
      .map(entry => entry.asset);
  } catch {
    return [];
  }
}
