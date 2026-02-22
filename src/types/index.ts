// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  joinedAt: string;
  followers: string[];
  following: string[];
  portfolios: string[];
  totalRewards: number;
  badges: Badge[];
  level: number;
  xp: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

// Asset Types
export type AssetType = 'stock' | 'etf' | 'bond' | 'commodity' | 'reit';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  sector: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  marketCap: number;
  beta: number;
  peRatio: number | null;
  dividendYield: number;
  weekHigh52: number;
  weekLow52: number;
  logoUrl?: string;
  // Extended fundamental metrics
  eps?: number | null;
  forwardEps?: number | null;
  forwardPE?: number | null;
  pegRatio?: number | null;
  priceToBook?: number | null;
  returnOnEquity?: number | null;
  returnOnAssets?: number | null;
  profitMargin?: number | null;
  operatingMargin?: number | null;
  grossMargin?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth?: number | null;
  industry?: string | null;
}

export interface AssetHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Soccer Formation Types
export type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1' | '3-4-3';

export interface Position {
  id: string;
  name: string;
  shortName: string;
  row: number; // 0 = goalkeeper, 1 = defense, 2 = midfield, 3 = attack
  col: number; // Position within the row
}

export const FORMATIONS: Record<Formation, Position[]> = {
  '4-3-3': [
    { id: 'gk', name: 'Goalkeeper', shortName: 'GK', row: 0, col: 1 },
    { id: 'lb', name: 'Left Back', shortName: 'LB', row: 1, col: 0 },
    { id: 'cb1', name: 'Center Back', shortName: 'CB', row: 1, col: 1 },
    { id: 'cb2', name: 'Center Back', shortName: 'CB', row: 1, col: 2 },
    { id: 'rb', name: 'Right Back', shortName: 'RB', row: 1, col: 3 },
    { id: 'lm', name: 'Left Midfielder', shortName: 'LM', row: 2, col: 0 },
    { id: 'cm', name: 'Center Midfielder', shortName: 'CM', row: 2, col: 1 },
    { id: 'rm', name: 'Right Midfielder', shortName: 'RM', row: 2, col: 2 },
    { id: 'lw', name: 'Left Wing', shortName: 'LW', row: 3, col: 0 },
    { id: 'st', name: 'Striker', shortName: 'ST', row: 3, col: 1 },
    { id: 'rw', name: 'Right Wing', shortName: 'RW', row: 3, col: 2 },
  ],
  '4-4-2': [
    { id: 'gk', name: 'Goalkeeper', shortName: 'GK', row: 0, col: 1 },
    { id: 'lb', name: 'Left Back', shortName: 'LB', row: 1, col: 0 },
    { id: 'cb1', name: 'Center Back', shortName: 'CB', row: 1, col: 1 },
    { id: 'cb2', name: 'Center Back', shortName: 'CB', row: 1, col: 2 },
    { id: 'rb', name: 'Right Back', shortName: 'RB', row: 1, col: 3 },
    { id: 'lm', name: 'Left Midfielder', shortName: 'LM', row: 2, col: 0 },
    { id: 'lcm', name: 'Left Center Mid', shortName: 'LCM', row: 2, col: 1 },
    { id: 'rcm', name: 'Right Center Mid', shortName: 'RCM', row: 2, col: 2 },
    { id: 'rm', name: 'Right Midfielder', shortName: 'RM', row: 2, col: 3 },
    { id: 'st1', name: 'Striker', shortName: 'ST', row: 3, col: 0 },
    { id: 'st2', name: 'Striker', shortName: 'ST', row: 3, col: 1 },
  ],
  '3-5-2': [
    { id: 'gk', name: 'Goalkeeper', shortName: 'GK', row: 0, col: 1 },
    { id: 'cb1', name: 'Center Back', shortName: 'CB', row: 1, col: 0 },
    { id: 'cb2', name: 'Center Back', shortName: 'CB', row: 1, col: 1 },
    { id: 'cb3', name: 'Center Back', shortName: 'CB', row: 1, col: 2 },
    { id: 'lwb', name: 'Left Wing Back', shortName: 'LWB', row: 2, col: 0 },
    { id: 'lcm', name: 'Left Center Mid', shortName: 'LCM', row: 2, col: 1 },
    { id: 'cdm', name: 'Defensive Mid', shortName: 'CDM', row: 2, col: 2 },
    { id: 'rcm', name: 'Right Center Mid', shortName: 'RCM', row: 2, col: 3 },
    { id: 'rwb', name: 'Right Wing Back', shortName: 'RWB', row: 2, col: 4 },
    { id: 'st1', name: 'Striker', shortName: 'ST', row: 3, col: 0 },
    { id: 'st2', name: 'Striker', shortName: 'ST', row: 3, col: 1 },
  ],
  '5-3-2': [
    { id: 'gk', name: 'Goalkeeper', shortName: 'GK', row: 0, col: 2 },
    { id: 'lwb', name: 'Left Wing Back', shortName: 'LWB', row: 1, col: 0 },
    { id: 'cb1', name: 'Center Back', shortName: 'CB', row: 1, col: 1 },
    { id: 'cb2', name: 'Center Back', shortName: 'CB', row: 1, col: 2 },
    { id: 'cb3', name: 'Center Back', shortName: 'CB', row: 1, col: 3 },
    { id: 'rwb', name: 'Right Wing Back', shortName: 'RWB', row: 1, col: 4 },
    { id: 'lm', name: 'Left Midfielder', shortName: 'LM', row: 2, col: 0 },
    { id: 'cm', name: 'Center Midfielder', shortName: 'CM', row: 2, col: 1 },
    { id: 'rm', name: 'Right Midfielder', shortName: 'RM', row: 2, col: 2 },
    { id: 'st1', name: 'Striker', shortName: 'ST', row: 3, col: 0 },
    { id: 'st2', name: 'Striker', shortName: 'ST', row: 3, col: 1 },
  ],
  '4-2-3-1': [
    { id: 'gk', name: 'Goalkeeper', shortName: 'GK', row: 0, col: 1 },
    { id: 'lb', name: 'Left Back', shortName: 'LB', row: 1, col: 0 },
    { id: 'cb1', name: 'Center Back', shortName: 'CB', row: 1, col: 1 },
    { id: 'cb2', name: 'Center Back', shortName: 'CB', row: 1, col: 2 },
    { id: 'rb', name: 'Right Back', shortName: 'RB', row: 1, col: 3 },
    { id: 'cdm1', name: 'Defensive Mid', shortName: 'CDM', row: 2, col: 0 },
    { id: 'cdm2', name: 'Defensive Mid', shortName: 'CDM', row: 2, col: 1 },
    { id: 'lam', name: 'Left Attacking Mid', shortName: 'LAM', row: 2, col: 2 },
    { id: 'cam', name: 'Center Attacking Mid', shortName: 'CAM', row: 2, col: 3 },
    { id: 'ram', name: 'Right Attacking Mid', shortName: 'RAM', row: 2, col: 4 },
    { id: 'st', name: 'Striker', shortName: 'ST', row: 3, col: 0 },
  ],
  '3-4-3': [
    { id: 'gk', name: 'Goalkeeper', shortName: 'GK', row: 0, col: 1 },
    { id: 'cb1', name: 'Center Back', shortName: 'CB', row: 1, col: 0 },
    { id: 'cb2', name: 'Center Back', shortName: 'CB', row: 1, col: 1 },
    { id: 'cb3', name: 'Center Back', shortName: 'CB', row: 1, col: 2 },
    { id: 'lm', name: 'Left Midfielder', shortName: 'LM', row: 2, col: 0 },
    { id: 'lcm', name: 'Left Center Mid', shortName: 'LCM', row: 2, col: 1 },
    { id: 'rcm', name: 'Right Center Mid', shortName: 'RCM', row: 2, col: 2 },
    { id: 'rm', name: 'Right Midfielder', shortName: 'RM', row: 2, col: 3 },
    { id: 'lw', name: 'Left Wing', shortName: 'LW', row: 3, col: 0 },
    { id: 'st', name: 'Striker', shortName: 'ST', row: 3, col: 1 },
    { id: 'rw', name: 'Right Wing', shortName: 'RW', row: 3, col: 2 },
  ],
};

// Portfolio Player (Asset in a position)
export interface PortfolioPlayer {
  positionId: string;
  asset: Asset | null;
  allocation: number; // Should be approximately 9.09% (100/11) per player
}

// Portfolio Types
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description: string;
  formation: Formation;
  players: PortfolioPlayer[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  likes: string[];
  clonedFrom: string | null;
  cloneCount: number;
  tags: string[];
}

export interface PortfolioPerformance {
  portfolioId: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayReturn: number;
  dayReturnPercent: number;
  weekReturn: number;
  weekReturnPercent: number;
  monthReturn: number;
  monthReturnPercent: number;
  yearReturn: number;
  yearReturnPercent: number;
  beta: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  winRate: number;
  historicalData: PortfolioHistoricalPoint[];
  // Day-over-day comparison fields
  dayVsPreviousDay: number;        // Today's change vs yesterday's change
  weekVsPreviousWeek: number;      // This week vs last week
  isImproving: boolean;            // Trend indicator
  // Portfolio-level calculated fundamental metrics
  alpha?: number | null;           // Portfolio Return - (Beta * Benchmark Return)
  weightedPE?: number | null;      // Weighted average P/E
  weightedEPS?: number | null;     // Weighted average EPS
  weightedPEG?: number | null;     // Weighted average PEG
  weightedPriceToBook?: number | null;
  weightedROE?: number | null;     // Weighted average ROE
  weightedProfitMargin?: number | null;
  weightedDebtToEquity?: number | null;
  benchmarkReturn?: number | null; // For Alpha calculation
  benchmarkSymbol?: string;        // e.g., 'SPY'
}

export interface PortfolioHistoricalPoint {
  date: string;
  value: number;
  return: number;
}

// Leaderboard Types
export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
export type LeaderboardMetric = 'return' | 'sharpe' | 'followers' | 'likes';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  portfolioId: string;
  portfolioName: string;
  formation: Formation;
  value: number;
  returnPercent: number;
  followers: number;
  createdAt: string;
}

// Social Types
export interface Activity {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  type: 'created_portfolio' | 'liked_portfolio' | 'cloned_portfolio' | 'followed_user' | 'earned_badge' | 'rebalanced';
  targetId: string;
  targetName: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_follower' | 'portfolio_liked' | 'portfolio_cloned' | 'badge_earned' | 'reward_earned';
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// Reward Types
export interface Reward {
  id: string;
  name: string;
  description: string;
  xpAmount: number;
  type: 'daily_login' | 'portfolio_created' | 'first_follow' | 'top_performer' | 'social_engagement';
  earnedAt: string;
}

// Risk Level Types
export type RiskLevel = 'low' | 'medium' | 'high';

export const POSITION_RISK_MAP: Record<number, RiskLevel> = {
  0: 'low',     // Goalkeeper - ultra safe
  1: 'low',     // Defenders - low risk
  2: 'medium',  // Midfielders - medium risk
  3: 'high',    // Attackers - high risk
};

// Get risk level from asset beta
export const getAssetRiskLevel = (beta: number): RiskLevel => {
  if (beta < 0.8) return 'low';
  if (beta <= 1.2) return 'medium';
  return 'high';
};

// Utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Authentication Types
export interface UserCredentials {
  id: string;
  userId: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  identifier: string; // username or email
  password: string;
}

// Benchmark Types
export type BenchmarkSymbol = 'SPY' | 'QQQ' | 'DIA' | 'IWM' | 'VTI';

export interface BenchmarkInfo {
  symbol: BenchmarkSymbol;
  name: string;
  description: string;
  color: string;
}

export const BENCHMARKS: BenchmarkInfo[] = [
  { symbol: 'SPY', name: 'S&P 500', description: 'SPDR S&P 500 ETF - Large-cap US stocks', color: '#ef4444' },
  { symbol: 'QQQ', name: 'Nasdaq 100', description: 'Invesco QQQ Trust - Tech-heavy index', color: '#f59e0b' },
  { symbol: 'DIA', name: 'Dow Jones', description: 'SPDR Dow Jones Industrial Average ETF', color: '#3b82f6' },
  { symbol: 'IWM', name: 'Russell 2000', description: 'iShares Russell 2000 ETF - Small-cap stocks', color: '#8b5cf6' },
  { symbol: 'VTI', name: 'Total Market', description: 'Vanguard Total Stock Market ETF', color: '#06b6d4' },
];

export type ComparisonTimeframe = '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD';

export const COMPARISON_TIMEFRAMES: { value: ComparisonTimeframe; label: string }[] = [
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'YTD', label: 'YTD' },
];

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

export interface CustomComparisonSymbol {
  symbol: string;
  name: string;
  color: string;
}

export interface HistoricalDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface BenchmarkPerformance {
  symbol: BenchmarkSymbol;
  name: string;
  color: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  winRate: number;
  historicalData: HistoricalDataPoint[];
  normalizedData: { date: string; value: number }[];
}
