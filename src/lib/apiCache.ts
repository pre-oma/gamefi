import { supabase } from './supabase';

interface CacheOptions {
  ttlMinutes?: number;
}

const DEFAULT_TTL_MINUTES = 15; // 15 minutes default cache

/**
 * Get cached data from database
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('api_cache')
      .select('cache_value, expires_at')
      .eq('cache_key', key)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired cache
      await supabase.from('api_cache').delete().eq('cache_key', key);
      return null;
    }

    return data.cache_value as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data in database
 */
export async function setCachedData<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const ttlMinutes = options.ttlMinutes ?? DEFAULT_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await supabase.from('api_cache').upsert(
      {
        cache_key: key,
        cache_value: value,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'cache_key' }
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached data
 */
export async function deleteCachedData(key: string): Promise<void> {
  try {
    await supabase.from('api_cache').delete().eq('cache_key', key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Clear all expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    await supabase.from('api_cache').delete().lt('expires_at', new Date().toISOString());
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

/**
 * In-memory cache for client-side caching
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = 15 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance for client-side caching
export const memoryCache = new MemoryCache();

/**
 * Wrapper function for caching API calls
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try memory cache first (for client-side)
  const memoryCached = memoryCache.get<T>(key);
  if (memoryCached) {
    return memoryCached;
  }

  // Try database cache
  const dbCached = await getCachedData<T>(key);
  if (dbCached) {
    // Also store in memory cache
    memoryCache.set(key, dbCached, (options.ttlMinutes ?? DEFAULT_TTL_MINUTES) * 60 * 1000);
    return dbCached;
  }

  // Fetch fresh data
  const freshData = await fetcher();

  // Store in both caches
  memoryCache.set(key, freshData, (options.ttlMinutes ?? DEFAULT_TTL_MINUTES) * 60 * 1000);
  await setCachedData(key, freshData, options);

  return freshData;
}

/**
 * Generate cache key for Yahoo Finance data
 */
export function yahooFinanceCacheKey(symbol: string, type: 'quote' | 'historical' | 'fundamentals'): string {
  return `yahoo:${type}:${symbol.toUpperCase()}`;
}
