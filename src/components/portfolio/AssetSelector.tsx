'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, Position, POSITION_RISK_MAP, RiskLevel, getAssetRiskLevel } from '@/types';
import { MOCK_ASSETS, SECTORS, addExternalAsset } from '@/data/assets';
import { cn, formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import { Input, Button, Modal } from '@/components/ui';
import { useAssetSearch } from '@/hooks/useAssetSearch';

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; badge: string }> = {
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500' },
  high: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500' },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

interface AssetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset | null) => void;
  position: Position | null;
  currentAsset: Asset | null;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  position,
  currentAsset,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showSuggestedOnly, setShowSuggestedOnly] = useState(false);

  // Use the async search hook
  const { results: searchResults, isLoading, error, searchTerm, setSearchTerm } = useAssetSearch('');

  // Get the risk level for the current position
  const positionRiskLevel = position ? POSITION_RISK_MAP[position.row] : null;

  // Determine which assets to show
  const filteredAssets = useMemo(() => {
    // If there's a search term, use search results (which may include Yahoo Finance results)
    // Otherwise, use the full MOCK_ASSETS list
    let assets = searchTerm.trim() ? searchResults : MOCK_ASSETS;

    if (selectedSector !== 'All') {
      assets = assets.filter((a) => a.sector === selectedSector);
    }

    if (selectedType !== 'All') {
      assets = assets.filter((a) => a.type === selectedType);
    }

    // Filter by matching risk level if showSuggestedOnly is enabled
    if (showSuggestedOnly && positionRiskLevel) {
      assets = assets.filter((a) => getAssetRiskLevel(a.beta) === positionRiskLevel);
    }

    // Sort assets: matching risk level first, then by day change
    if (positionRiskLevel) {
      assets = [...assets].sort((a, b) => {
        const aMatches = getAssetRiskLevel(a.beta) === positionRiskLevel;
        const bMatches = getAssetRiskLevel(b.beta) === positionRiskLevel;
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return b.dayChangePercent - a.dayChangePercent;
      });
    }

    return assets;
  }, [searchTerm, searchResults, selectedSector, selectedType, showSuggestedOnly, positionRiskLevel]);

  const handleSelect = (asset: Asset) => {
    // If this asset came from Yahoo Finance (not in MOCK_ASSETS), save it to external assets
    const isExternal = !MOCK_ASSETS.some((a) => a.id === asset.id);
    if (isExternal) {
      addExternalAsset(asset);
    }

    onSelect(asset);
    onClose();
    setSearchTerm('');
    setSelectedSector('All');
    setSelectedType('All');
  };

  const handleRemove = () => {
    onSelect(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Select Asset for ${position?.name || 'Position'}`} size="lg">
      <div className="space-y-4">
        {/* Current Selection */}
        {currentAsset && (
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-emerald-400">{currentAsset.symbol.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-white">{currentAsset.symbol}</p>
                <p className="text-sm text-slate-400">{currentAsset.name}</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        )}

        {/* Position Risk Info */}
        {positionRiskLevel && (
          <div className={cn(
            'flex items-center justify-between p-3 rounded-lg border',
            RISK_COLORS[positionRiskLevel].bg,
            positionRiskLevel === 'low' ? 'border-blue-500/30' : positionRiskLevel === 'medium' ? 'border-yellow-500/30' : 'border-red-500/30'
          )}>
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', RISK_COLORS[positionRiskLevel].badge)} />
              <span className="text-slate-300 text-sm">
                This position suggests <span className={cn('font-medium', RISK_COLORS[positionRiskLevel].text)}>{RISK_LABELS[positionRiskLevel]}</span> assets
              </span>
            </div>
            <button
              onClick={() => setShowSuggestedOnly(!showSuggestedOnly)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                showSuggestedOnly
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              {showSuggestedOnly ? 'Showing Suggested' : 'Show All'}
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, symbol, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                isLoading ? (
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
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Types</option>
            <option value="stock">Stocks</option>
            <option value="etf">ETFs</option>
            <option value="bond">Bonds</option>
            <option value="reit">REITs</option>
            <option value="commodity">Commodities</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Search Hint */}
        {searchTerm.trim() && filteredAssets.length === 0 && !isLoading && !error && (
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">
              No local matches found. Try a valid stock ticker (e.g., PLTR, TSLA) to search Yahoo Finance.
            </p>
          </div>
        )}

        {/* Asset List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {/* Loading State */}
          {isLoading && searchTerm.trim() && (
            <div className="py-8 text-center">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Searching for &ldquo;{searchTerm}&rdquo;...</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {!isLoading && filteredAssets.map((asset) => {
              const assetRiskLevel = getAssetRiskLevel(asset.beta);
              const isMatchingRisk = positionRiskLevel && assetRiskLevel === positionRiskLevel;
              const riskColors = RISK_COLORS[assetRiskLevel];
              const isExternal = !MOCK_ASSETS.some((a) => a.id === asset.id);

              return (
                <motion.button
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => handleSelect(asset)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200',
                    'bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50',
                    currentAsset?.id === asset.id && 'ring-2 ring-emerald-500 bg-emerald-500/10',
                    isMatchingRisk && 'border-emerald-500/30 bg-emerald-500/5'
                  )}
                >
                  {/* Symbol Badge */}
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                    <span className="font-bold text-white">{asset.symbol.slice(0, 2)}</span>
                    {/* Risk Level Indicator */}
                    <div className={cn(
                      'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                      riskColors.badge
                    )} title={RISK_LABELS[assetRiskLevel]} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{asset.symbol}</span>
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400 uppercase">
                        {asset.type}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        riskColors.bg,
                        riskColors.text
                      )}>
                        {assetRiskLevel === 'low' ? 'Low' : assetRiskLevel === 'medium' ? 'Med' : 'High'}
                      </span>
                      {isMatchingRisk && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs font-medium text-emerald-400">
                          Suggested
                        </span>
                      )}
                      {isExternal && (
                        <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs font-medium text-purple-400">
                          Yahoo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-500">{asset.sector}</p>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-white">{formatCurrency(asset.currentPrice)}</p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        asset.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}
                    >
                      {formatPercent(asset.dayChangePercent)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex flex-col gap-1 text-right min-w-[100px]">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">P/E:</span>
                      <span className="text-slate-300">{asset.peRatio !== null ? asset.peRatio.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Beta:</span>
                      <span className={riskColors.text}>{asset.beta.toFixed(2)}</span>
                    </div>
                    {asset.eps !== undefined && asset.eps !== null && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">EPS:</span>
                        <span className="text-slate-300">${asset.eps.toFixed(2)}</span>
                      </div>
                    )}
                    {asset.dividendYield > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Div:</span>
                        <span className="text-emerald-400">{asset.dividendYield.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {!isLoading && filteredAssets.length === 0 && !searchTerm.trim() && (
            <div className="py-12 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No assets found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
