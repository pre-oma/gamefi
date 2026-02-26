'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Portfolio, PortfolioPlayer, Position, Formation, FORMATIONS, Asset, POSITION_RISK_MAP, RiskLevel } from '@/types';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

const RISK_COLORS: Record<RiskLevel, { bg: string; border: string; text: string }> = {
  low: { bg: 'bg-blue-500', border: 'border-blue-500/50', text: 'text-blue-400' },
  medium: { bg: 'bg-yellow-500', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  high: { bg: 'bg-red-500', border: 'border-red-500/50', text: 'text-red-400' },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Med Risk',
  high: 'High Risk',
};

interface FormationFieldProps {
  portfolio: Portfolio;
  onPositionClick?: (player: PortfolioPlayer, position: Position) => void;
  isEditable?: boolean;
  compact?: boolean;
}

// Default allocation per player (100% / 11 players)
const DEFAULT_ALLOCATION = 100 / 11;

// Maximum vertical offset based on weight (as percentage of field height)
const MAX_WEIGHT_OFFSET = 8;

const getPositionCoords = (
  position: Position,
  formation: Formation,
  allocation: number = DEFAULT_ALLOCATION
): { x: number; y: number } => {
  const positions = FORMATIONS[formation];

  // Calculate row positions (bottom to top)
  const rowYPositions = [85, 65, 40, 15]; // GK, DEF, MID, ATK

  // Find positions in the same row
  const sameRowPositions = positions.filter((p) => p.row === position.row);
  const positionIndex = sameRowPositions.findIndex((p) => p.id === position.id);
  const totalInRow = sameRowPositions.length;

  // Calculate X position (evenly distributed)
  const spacing = 80 / (totalInRow + 1);
  const x = 10 + spacing * (positionIndex + 1);

  // Calculate Y offset based on weight deviation from average
  // Higher weight = negative offset (moves UP on field)
  const weightDeviation = allocation - DEFAULT_ALLOCATION;
  const normalizedDeviation = weightDeviation / DEFAULT_ALLOCATION; // -1 to ~10 range
  const yOffset = -normalizedDeviation * MAX_WEIGHT_OFFSET; // Clamped offset

  // Clamp offset to prevent overlapping with other rows
  const clampedOffset = Math.max(-MAX_WEIGHT_OFFSET, Math.min(MAX_WEIGHT_OFFSET, yOffset));
  const y = rowYPositions[position.row] + clampedOffset;

  return { x, y };
};

const PlayerSlot: React.FC<{
  player: PortfolioPlayer;
  position: Position;
  formation: Formation;
  onClick?: () => void;
  isEditable?: boolean;
  compact?: boolean;
}> = ({ player, position, formation, onClick, isEditable, compact }) => {
  const allocation = player.allocation || DEFAULT_ALLOCATION;
  const { x, y } = getPositionCoords(position, formation, allocation);
  const hasAsset = player.asset !== null;
  const riskLevel = POSITION_RISK_MAP[position.row];
  const riskColor = RISK_COLORS[riskLevel];
  const isHighWeight = allocation > DEFAULT_ALLOCATION + 2;
  const isLowWeight = allocation < DEFAULT_ALLOCATION - 2;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5, delay: Math.random() * 0.3 }}
      onClick={onClick}
      disabled={!isEditable}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2 group',
        isEditable && 'cursor-pointer'
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* Risk Level Badge - only show if no asset */}
      {!compact && !hasAsset && (
        <div
          className={cn(
            'absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap z-10',
            riskColor.bg,
            'text-white'
          )}
          title={`${RISK_LABELS[riskLevel]} position`}
        >
          {riskLevel === 'low' ? 'LOW' : riskLevel === 'medium' ? 'MED' : 'HIGH'}
        </div>
      )}

      {/* Player Circle */}
      <div
        className={cn(
          'relative rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300',
          compact ? 'w-10 h-10' : 'w-14 h-14 sm:w-16 sm:h-16',
          hasAsset
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50'
            : cn('bg-slate-800/60 border-dashed', riskColor.border),
          isEditable && 'hover:scale-110 hover:border-emerald-400'
        )}
      >
        {hasAsset ? (
          <>
            <span className={cn('font-bold text-white', compact ? 'text-xs' : 'text-sm')}>
              {player.asset!.symbol}
            </span>
            {!compact && (
              <span
                className={cn(
                  'text-xs font-medium',
                  player.asset!.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {formatPercent(player.asset!.dayChangePercent)}
              </span>
            )}
          </>
        ) : (
          <span className={cn('text-slate-500', compact ? 'text-xs' : 'text-sm')}>
            {position.shortName}
          </span>
        )}

        {/* Position Badge */}
        <div
          className={cn(
            'absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-xs font-medium',
            hasAsset ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400',
            compact && 'text-[10px] px-1'
          )}
        >
          {position.shortName}
        </div>

        {/* Add Icon for empty slots */}
        {!hasAsset && isEditable && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Weight Badge */}
      {hasAsset && !compact && (
        <div
          className={cn(
            'absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap',
            isHighWeight ? 'bg-emerald-500 text-white' : isLowWeight ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 text-slate-300'
          )}
        >
          {allocation.toFixed(1)}%
        </div>
      )}

      {/* Hover Card */}
      {hasAsset && !compact && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl min-w-[140px]">
            <p className="font-medium text-white text-sm">{player.asset!.name}</p>
            <p className="text-slate-400 text-xs">{player.asset!.sector}</p>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-400">Weight:</span>
              <span className={cn(
                'font-semibold',
                isHighWeight ? 'text-emerald-400' : isLowWeight ? 'text-slate-400' : 'text-white'
              )}>
                {allocation.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Price:</span>
              <span className="text-white">{formatCurrency(player.asset!.currentPrice)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Day:</span>
              <span className={player.asset!.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {formatPercent(player.asset!.dayChangePercent)}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-400">Position Risk:</span>
              <span className={riskColor.text}>{RISK_LABELS[riskLevel]}</span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      )}
    </motion.button>
  );
};

export const FormationField: React.FC<FormationFieldProps> = ({
  portfolio,
  onPositionClick,
  isEditable = false,
  compact = false,
}) => {
  const positions = FORMATIONS[portfolio.formation];

  return (
    <div
      className={cn(
        'relative bg-gradient-to-b from-emerald-900/30 via-emerald-800/20 to-emerald-900/30 rounded-2xl overflow-hidden',
        compact ? 'aspect-[4/5]' : 'aspect-[4/5] sm:aspect-[3/4]'
      )}
    >
      {/* Field Lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Outer Border */}
        <rect x="5%" y="5%" width="90%" height="90%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        {/* Center Line */}
        <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        {/* Center Circle */}
        <circle cx="50%" cy="50%" r="12%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="1%" fill="rgba(255,255,255,0.2)" />

        {/* Penalty Areas */}
        <rect x="25%" y="5%" width="50%" height="15%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <rect x="25%" y="80%" width="50%" height="15%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        {/* Goal Areas */}
        <rect x="35%" y="5%" width="30%" height="6%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <rect x="35%" y="89%" width="30%" height="6%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      </svg>

      {/* Formation Label */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900/60 rounded-lg backdrop-blur-sm">
        <span className="text-xs font-medium text-emerald-400">{portfolio.formation}</span>
      </div>

      {/* Player Positions */}
      {portfolio.players.map((player) => {
        const position = positions.find((p) => p.id === player.positionId);
        if (!position) return null;

        return (
          <PlayerSlot
            key={player.positionId}
            player={player}
            position={position}
            formation={portfolio.formation}
            onClick={() => onPositionClick?.(player, position)}
            isEditable={isEditable}
            compact={compact}
          />
        );
      })}

      {/* Grass Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.03) 20px,
            rgba(255,255,255,0.03) 40px
          )`,
        }}
      />
    </div>
  );
};
