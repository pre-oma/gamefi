/* Yahoo Finance historical fetch — shared between the public
   /api/yahoo-finance/historical HTTP route and server-side helpers
   (challengePerformance, etc) so the latter don't need to round-trip
   through their own deployment. That round-trip breaks on Vercel
   preview deployments behind SSO because the server-to-server fetch
   has no auth cookie and gets a 401 wall. */

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

/* Map app-side timeframe shorthands to Yahoo range/interval. Mirrors
   the prior in-route mapping. */
export function getYahooParams(timeframe: string): { range: string; interval: string } {
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

export interface FetchHistoricalOptions {
  symbol: string;
  /* Either supply both startDate and endDate (YYYY-MM-DD), or supply
     timeframe. If both are supplied, startDate/endDate wins. */
  startDate?: string;
  endDate?: string;
  timeframe?: string;
}

export interface FetchHistoricalResult {
  ok: boolean;
  status: number;
  data: HistoricalDataPoint[];
  error?: string;
}

/* Validate symbol format (alphanumeric, dots, dashes; up to 10 chars).
   Mirrors the prior in-route regex so request shape stays identical. */
const SYMBOL_REGEX = /^[A-Za-z0-9.\-]{1,10}$/;

/* Fetch historical price data directly from Yahoo Finance — no proxying
   through our own API. Returns { ok, status, data, error } so callers
   can distinguish a clean empty response from a network/parse failure. */
export async function fetchYahooHistorical(
  options: FetchHistoricalOptions,
): Promise<FetchHistoricalResult> {
  const { symbol, startDate, endDate, timeframe = '1M' } = options;

  if (!symbol) {
    return { ok: false, status: 400, data: [], error: 'Symbol required' };
  }
  if (!SYMBOL_REGEX.test(symbol)) {
    return { ok: false, status: 400, data: [], error: 'Invalid symbol format' };
  }

  const upperSymbol = symbol.toUpperCase();
  let url: string;

  if (startDate && endDate) {
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    /* +1 day on period2 so the end date is inclusive of intraday data. */
    const period2 = Math.floor(new Date(endDate).getTime() / 1000) + 86400;
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      upperSymbol,
    )}?interval=1d&period1=${period1}&period2=${period2}`;
  } else {
    const { range, interval } = getYahooParams(timeframe);
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      upperSymbol,
    )}?interval=${interval}&range=${range}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        /* Yahoo rejects requests without a browser-ish UA. */
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API returned ${response.status} for ${upperSymbol}`);
      return {
        ok: false,
        status: 404,
        data: [],
        error: `Yahoo returned ${response.status}`,
      };
    }

    const json: YahooChartResponse = await response.json();

    if (json.chart.error) {
      console.error('Yahoo Finance API error:', json.chart.error);
      return {
        ok: false,
        status: 404,
        data: [],
        error: json.chart.error.description || 'Symbol not found',
      };
    }

    if (!json.chart.result || json.chart.result.length === 0) {
      return { ok: false, status: 404, data: [], error: 'Symbol not found' };
    }

    const result = json.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0] || {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
    };
    const adjclose = result.indicators.adjclose?.[0]?.adjclose || [];

    const historicalData: HistoricalDataPoint[] = timestamps
      .map((ts, index) => ({
        timestamp: ts * 1000,
        date: new Date(ts * 1000).toISOString().split('T')[0],
        open: quote.open?.[index] ?? 0,
        high: quote.high?.[index] ?? 0,
        low: quote.low?.[index] ?? 0,
        close: quote.close?.[index] ?? 0,
        volume: quote.volume?.[index] ?? 0,
        adjClose: adjclose[index] ?? quote.close?.[index] ?? 0,
      }))
      /* Drop invalid rows — Yahoo sometimes returns zero-close
         placeholders for non-trading hours/days that throw off
         start/end-price comparisons downstream. */
      .filter((point) => point.close > 0);

    return { ok: true, status: 200, data: historicalData };
  } catch (error) {
    console.error('Yahoo Finance fetch failed:', error);
    return {
      ok: false,
      status: 500,
      data: [],
      error: 'Failed to fetch from Yahoo Finance',
    };
  }
}
