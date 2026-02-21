import { NextRequest, NextResponse } from 'next/server';

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
        adjclose?: Array<{
          adjclose: number[];
        }>;
      };
    }> | null;
    error: null | { code: string; description: string };
  };
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

export interface HistoricalDataResponse {
  success: boolean;
  symbol?: string;
  data?: HistoricalDataPoint[];
  error?: string;
}

// Map timeframe to Yahoo Finance range/interval parameters
function getYahooParams(timeframe: string): { range: string; interval: string } {
  switch (timeframe.toUpperCase()) {
    case '1W':
      return { range: '5d', interval: '1h' };
    case '1M':
      return { range: '1mo', interval: '1d' };
    case '3M':
      return { range: '3mo', interval: '1d' };
    case '6M':
      return { range: '6mo', interval: '1d' };
    case '1Y':
      return { range: '1y', interval: '1d' };
    case 'YTD':
      return { range: 'ytd', interval: '1d' };
    default:
      return { range: '1mo', interval: '1d' };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe') || '1M';
  const startDate = searchParams.get('startDate'); // Custom start date (YYYY-MM-DD)
  const endDate = searchParams.get('endDate'); // Custom end date (YYYY-MM-DD)

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  // Validate symbol format (alphanumeric, 1-10 characters, may include dots and dashes)
  const symbolRegex = /^[A-Za-z0-9.\-]{1,10}$/;
  if (!symbolRegex.test(symbol)) {
    return NextResponse.json(
      { success: false, error: 'Invalid symbol format' },
      { status: 400 }
    );
  }

  try {
    const upperSymbol = symbol.toUpperCase();
    let url: string;

    // If custom date range is provided, use period1/period2
    if (startDate && endDate) {
      const period1 = Math.floor(new Date(startDate).getTime() / 1000);
      const period2 = Math.floor(new Date(endDate).getTime() / 1000) + 86400; // Add one day to include end date
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upperSymbol)}?interval=1d&period1=${period1}&period2=${period2}`;
    } else {
      const { range, interval } = getYahooParams(timeframe);
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upperSymbol)}?interval=${interval}&range=${range}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API returned ${response.status}`);
      return NextResponse.json(
        { success: false, error: 'Symbol not found' },
        { status: 404 }
      );
    }

    const data: YahooChartResponse = await response.json();

    if (data.chart.error) {
      console.error('Yahoo Finance API error:', data.chart.error);
      return NextResponse.json(
        { success: false, error: data.chart.error.description || 'Symbol not found' },
        { status: 404 }
      );
    }

    if (!data.chart.result || data.chart.result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symbol not found' },
        { status: 404 }
      );
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0] || {};
    const adjclose = result.indicators.adjclose?.[0]?.adjclose || [];

    const historicalData: HistoricalDataPoint[] = timestamps.map((ts, index) => ({
      timestamp: ts * 1000, // Convert to milliseconds
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quote.open?.[index] ?? 0,
      high: quote.high?.[index] ?? 0,
      low: quote.low?.[index] ?? 0,
      close: quote.close?.[index] ?? 0,
      volume: quote.volume?.[index] ?? 0,
      adjClose: adjclose[index] ?? quote.close?.[index] ?? 0,
    })).filter(point => point.close > 0); // Filter out invalid data points

    return NextResponse.json({
      success: true,
      symbol: upperSymbol,
      data: historicalData,
    });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch historical data from Yahoo Finance' },
      { status: 500 }
    );
  }
}
