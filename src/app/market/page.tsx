'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Header, Input } from '@/components';
import { MOCK_ASSETS, SECTORS, getAllAssets, addExternalAsset } from '@/data/assets';
import { cn, formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import { Asset } from '@/types';

export default function MarketPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadData } = useStore();
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'marketCap'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use the async search hook for Yahoo Finance integration
  const { results: searchResults, isLoading: isSearching, error: searchError, searchTerm, setSearchTerm } = useAssetSearch('');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const filteredAssets = useMemo(() => {
    // If searching, use search results (includes Yahoo Finance)
    // Otherwise, show all assets (MOCK_ASSETS + any cached external assets)
    let assets: Asset[] = searchTerm.trim() ? searchResults : getAllAssets();

    // Apply sector filter
    if (selectedSector !== 'All') {
      assets = assets.filter((a) => a.sector === selectedSector);
    }

    // Apply sorting
    assets = [...assets].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'change':
          comparison = a.dayChangePercent - b.dayChangePercent;
          break;
        case 'marketCap':
          comparison = a.marketCap - b.marketCap;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return assets;
  }, [searchTerm, searchResults, selectedSector, sortBy, sortOrder]);

  const marketStats = useMemo(() => {
    const allAssets = getAllAssets();
    const gainers = allAssets.filter((a) => a.dayChangePercent > 0).length;
    const losers = allAssets.filter((a) => a.dayChangePercent < 0).length;
    const avgChange = allAssets.reduce((sum, a) => sum + a.dayChangePercent, 0) / allAssets.length;
    const totalMarketCap = allAssets.reduce((sum, a) => sum + a.marketCap, 0);

    return { gainers, losers, avgChange, totalMarketCap, totalAssets: allAssets.length };
  }, []);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Save external asset when displayed (for persistence)
  const handleAssetView = (asset: Asset) => {
    const isExternal = !MOCK_ASSETS.some((a) => a.id === asset.id);
    if (isExternal) {
      addExternalAsset(asset);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Market</h1>
          <p className="text-slate-400">Browse available assets to build your investment team.</p>
        </motion.div>

        {/* Market Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-white">{marketStats.totalAssets}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Gainers/Losers</p>
            <p className="text-2xl font-bold">
              <span className="text-emerald-400">{marketStats.gainers}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-red-400">{marketStats.losers}</span>
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Avg. Change</p>
            <p className={cn('text-2xl font-bold', marketStats.avgChange >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {formatPercent(marketStats.avgChange)}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Total Market Cap</p>
            <p className="text-2xl font-bold text-white">${formatNumber(marketStats.totalMarketCap)}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <Input
              placeholder="Search by name, symbol, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                isSearching ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )
              }
            />
          </div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Sectors</option>
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </motion.div>

        {/* Search Error */}
        {searchError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{searchError}</p>
          </div>
        )}

        {/* Search Hint */}
        {searchTerm.trim() && filteredAssets.length === 0 && !isSearching && !searchError && (
          <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">
              No matches found. Try a valid stock ticker (e.g., PLTR, TSLA) to search Yahoo Finance.
            </p>
          </div>
        )}

        {/* Assets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <button
              onClick={() => handleSort('name')}
              className="col-span-4 flex items-center gap-1 hover:text-white transition-colors text-left"
            >
              Asset
              {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
            <div className="col-span-2">Sector</div>
            <button
              onClick={() => handleSort('price')}
              className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-right justify-end"
            >
              Price
              {sortBy === 'price' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
            <button
              onClick={() => handleSort('change')}
              className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-right justify-end"
            >
              24h Change
              {sortBy === 'change' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
            <button
              onClick={() => handleSort('marketCap')}
              className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-right justify-end"
            >
              Market Cap
              {sortBy === 'marketCap' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
          </div>

          {/* Loading State */}
          {isSearching && searchTerm.trim() && (
            <div className="py-12 text-center">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Searching for &ldquo;{searchTerm}&rdquo;...</p>
            </div>
          )}

          {/* Table Body */}
          {!isSearching && (
            <div className="divide-y divide-slate-800">
              {filteredAssets.map((asset, index) => {
                const isExternal = !MOCK_ASSETS.some((a) => a.id === asset.id);

                // Save external assets for persistence
                if (isExternal) {
                  handleAssetView(asset);
                }

                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Asset Info */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-emerald-400 text-sm">{asset.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{asset.symbol}</span>
                          <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-400 uppercase">{asset.type}</span>
                          {isExternal && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 rounded text-xs text-purple-400">Yahoo</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{asset.name}</p>
                      </div>
                    </div>

                    {/* Sector */}
                    <div className="col-span-2">
                      <span className="text-sm text-slate-400">{asset.sector}</span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 text-right">
                      <span className="font-medium text-white">{formatCurrency(asset.currentPrice)}</span>
                    </div>

                    {/* Change */}
                    <div className="col-span-2 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-medium',
                          asset.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {asset.dayChangePercent >= 0 ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {formatPercent(asset.dayChangePercent, false)}
                      </span>
                    </div>

                    {/* Market Cap */}
                    <div className="col-span-2 text-right">
                      <span className="text-slate-400">${formatNumber(asset.marketCap)}</span>
                    </div>
                  </motion.div>
                );
              })}

              {!isSearching && filteredAssets.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  No assets found matching your criteria.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
