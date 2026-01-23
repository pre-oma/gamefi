import { NextRequest, NextResponse } from 'next/server';
import { Asset, AssetType } from '@/types';

interface YahooChartMeta {
  currency: string;
  symbol: string;
  instrumentType: string;
  regularMarketPrice: number;
  chartPreviousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  longName?: string;
  shortName?: string;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: YahooChartMeta;
    }> | null;
    error: null | { code: string; description: string };
  };
}

function mapInstrumentTypeToAssetType(instrumentType?: string): AssetType {
  switch (instrumentType?.toUpperCase()) {
    case 'EQUITY':
      return 'stock';
    case 'ETF':
      return 'etf';
    case 'MUTUALFUND':
      return 'etf';
    default:
      return 'stock';
  }
}

function mapChartToAsset(meta: YahooChartMeta): Asset {
  const currentPrice = meta.regularMarketPrice || 0;
  const previousClose = meta.chartPreviousClose || 0;
  const dayChange = currentPrice - previousClose;
  const dayChangePercent = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;

  return {
    id: meta.symbol.toLowerCase(),
    symbol: meta.symbol.toUpperCase(),
    name: meta.longName || meta.shortName || meta.symbol,
    type: mapInstrumentTypeToAssetType(meta.instrumentType),
    sector: 'Other', // Chart API doesn't provide sector
    currentPrice,
    previousClose,
    dayChange,
    dayChangePercent,
    marketCap: 0, // Not available in chart API
    beta: 1.0, // Not available in chart API
    peRatio: null, // Not available in chart API
    dividendYield: 0, // Not available in chart API
    weekHigh52: meta.fiftyTwoWeekHigh || 0,
    weekLow52: meta.fiftyTwoWeekLow || 0,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

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
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upperSymbol)}?interval=1d&range=1d`;

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

    const meta = data.chart.result[0].meta;

    // Allow price = 0 for inactive/delisted tickers, only reject if undefined
    if (meta.regularMarketPrice === undefined || meta.regularMarketPrice === null) {
      return NextResponse.json(
        { success: false, error: 'No price data available for this symbol' },
        { status: 404 }
      );
    }

    const asset = mapChartToAsset(meta);
    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data from Yahoo Finance' },
      { status: 500 }
    );
  }
}
