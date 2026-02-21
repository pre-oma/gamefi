import {
  BenchmarkSymbol,
  BenchmarkPerformance,
  ComparisonTimeframe,
  HistoricalDataPoint,
  BENCHMARKS,
  CustomDateRange,
  CustomComparisonSymbol,
} from '@/types';

export interface FetchHistoricalDataResponse {
  success: boolean;
  symbol?: string;
  data?: HistoricalDataPoint[];
  error?: string;
}

export interface FetchHistoricalDataOptions {
  timeframe?: ComparisonTimeframe;
  dateRange?: CustomDateRange | null;
}

/**
 * Fetch historical data for a symbol from the API
 */
export async function fetchHistoricalData(
  symbol: string,
  options: FetchHistoricalDataOptions = {}
): Promise<HistoricalDataPoint[]> {
  try {
    let url = `/api/yahoo-finance/historical?symbol=${encodeURIComponent(symbol)}`;

    if (options.dateRange) {
      url += `&startDate=${encodeURIComponent(options.dateRange.startDate)}&endDate=${encodeURIComponent(options.dateRange.endDate)}`;
    } else if (options.timeframe) {
      url += `&timeframe=${encodeURIComponent(options.timeframe)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch historical data for ${symbol}`);
      return [];
    }

    const data: FetchHistoricalDataResponse = await response.json();

    if (!data.success || !data.data) {
      console.error(`API error for ${symbol}:`, data.error);
      return [];
    }

    return data.data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch historical data for a benchmark symbol from the API
 */
export async function fetchBenchmarkHistoricalData(
  symbol: BenchmarkSymbol,
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<HistoricalDataPoint[]> {
  return fetchHistoricalData(symbol, { timeframe, dateRange });
}

/**
 * Calculate performance metrics from historical data
 */
export function calculateBenchmarkPerformance(
  symbol: BenchmarkSymbol,
  historicalData: HistoricalDataPoint[]
): BenchmarkPerformance | null {
  if (historicalData.length < 2) {
    return null;
  }

  const benchmarkInfo = BENCHMARKS.find((b) => b.symbol === symbol);
  if (!benchmarkInfo) {
    return null;
  }

  const firstPrice = historicalData[0].close;
  const lastPrice = historicalData[historicalData.length - 1].close;

  // Calculate total return
  const totalReturn = lastPrice - firstPrice;
  const totalReturnPercent = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Calculate daily returns for volatility
  const dailyReturns: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prevClose = historicalData[i - 1].close;
    const currClose = historicalData[i].close;
    if (prevClose > 0) {
      dailyReturns.push((currClose - prevClose) / prevClose);
    }
  }

  // Calculate volatility (annualized standard deviation)
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    (dailyReturns.length - 1);
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100; // 252 trading days

  // Calculate Sharpe ratio (assuming risk-free rate of 4%)
  const riskFreeRate = 0.04;
  const annualizedReturn = avgReturn * 252;
  const sharpeRatio = (annualizedReturn - riskFreeRate) / (dailyVolatility * Math.sqrt(252));

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = historicalData[0].close;
  for (const point of historicalData) {
    if (point.close > peak) {
      peak = point.close;
    }
    const drawdown = ((peak - point.close) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Calculate normalized data (starting from 100)
  const normalizedData = historicalData.map((point) => ({
    date: point.date,
    value: (point.close / firstPrice) * 100,
  }));

  return {
    symbol,
    name: benchmarkInfo.name,
    color: benchmarkInfo.color,
    totalReturn,
    totalReturnPercent,
    volatility: annualizedVolatility,
    sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0,
    maxDrawdown,
    historicalData,
    normalizedData,
  };
}

/**
 * Fetch and calculate performance for a benchmark
 */
export async function getBenchmarkPerformance(
  symbol: BenchmarkSymbol,
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<BenchmarkPerformance | null> {
  const historicalData = await fetchBenchmarkHistoricalData(symbol, timeframe, dateRange);
  if (historicalData.length === 0) {
    return null;
  }
  return calculateBenchmarkPerformance(symbol, historicalData);
}

/**
 * Fetch and calculate performance for multiple benchmarks
 */
export async function getMultipleBenchmarkPerformances(
  symbols: BenchmarkSymbol[],
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<BenchmarkPerformance[]> {
  const performances = await Promise.all(
    symbols.map((symbol) => getBenchmarkPerformance(symbol, timeframe, dateRange))
  );
  return performances.filter((p): p is BenchmarkPerformance => p !== null);
}

/**
 * Calculate performance for a custom symbol
 */
export function calculateCustomSymbolPerformance(
  symbol: CustomComparisonSymbol,
  historicalData: HistoricalDataPoint[]
): BenchmarkPerformance | null {
  if (historicalData.length < 2) {
    return null;
  }

  const firstPrice = historicalData[0].close;
  const lastPrice = historicalData[historicalData.length - 1].close;

  // Calculate total return
  const totalReturn = lastPrice - firstPrice;
  const totalReturnPercent = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Calculate daily returns for volatility
  const dailyReturns: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prevClose = historicalData[i - 1].close;
    const currClose = historicalData[i].close;
    if (prevClose > 0) {
      dailyReturns.push((currClose - prevClose) / prevClose);
    }
  }

  // Calculate volatility (annualized standard deviation)
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    (dailyReturns.length - 1);
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100;

  // Calculate Sharpe ratio
  const riskFreeRate = 0.04;
  const annualizedReturn = avgReturn * 252;
  const sharpeRatio = (annualizedReturn - riskFreeRate) / (dailyVolatility * Math.sqrt(252));

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = historicalData[0].close;
  for (const point of historicalData) {
    if (point.close > peak) {
      peak = point.close;
    }
    const drawdown = ((peak - point.close) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Calculate normalized data
  const normalizedData = historicalData.map((point) => ({
    date: point.date,
    value: (point.close / firstPrice) * 100,
  }));

  return {
    symbol: symbol.symbol as BenchmarkSymbol,
    name: symbol.name,
    color: symbol.color,
    totalReturn,
    totalReturnPercent,
    volatility: annualizedVolatility,
    sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0,
    maxDrawdown,
    historicalData,
    normalizedData,
  };
}

/**
 * Fetch and calculate performance for a custom symbol
 */
export async function getCustomSymbolPerformance(
  symbol: CustomComparisonSymbol,
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<BenchmarkPerformance | null> {
  const historicalData = await fetchHistoricalData(symbol.symbol, { timeframe, dateRange });
  if (historicalData.length === 0) {
    return null;
  }
  return calculateCustomSymbolPerformance(symbol, historicalData);
}

/**
 * Fetch and calculate performance for multiple custom symbols
 */
export async function getMultipleCustomSymbolPerformances(
  symbols: CustomComparisonSymbol[],
  timeframe: ComparisonTimeframe,
  dateRange?: CustomDateRange | null
): Promise<BenchmarkPerformance[]> {
  const performances = await Promise.all(
    symbols.map((symbol) => getCustomSymbolPerformance(symbol, timeframe, dateRange))
  );
  return performances.filter((p): p is BenchmarkPerformance => p !== null);
}
