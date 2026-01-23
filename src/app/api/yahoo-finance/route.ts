import { NextRequest, NextResponse } from 'next/server';
import { Asset, AssetType } from '@/types';

interface YahooQuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  quoteType?: string;
  sector?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  beta?: number;
  trailingPE?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

interface YahooFinanceResponse {
  quoteResponse?: {
    result: YahooQuoteResult[];
    error: null | { code: string; description: string };
  };
  finance?: {
    result: Array<{
      quotes: YahooQuoteResult[];
    }>;
    error: null | { code: string; description: string };
  };
}

function mapQuoteTypeToAssetType(quoteType?: string): AssetType {
  switch (quoteType?.toUpperCase()) {
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

function mapYahooToAsset(quote: YahooQuoteResult): Asset {
  return {
    id: quote.symbol.toLowerCase(),
    symbol: quote.symbol.toUpperCase(),
    name: quote.shortName || quote.longName || quote.symbol,
    type: mapQuoteTypeToAssetType(quote.quoteType),
    sector: quote.sector || 'Other',
    currentPrice: quote.regularMarketPrice || 0,
    previousClose: quote.regularMarketPreviousClose || 0,
    dayChange: quote.regularMarketChange || 0,
    dayChangePercent: quote.regularMarketChangePercent || 0,
    marketCap: quote.marketCap || 0,
    beta: quote.beta || 1.0,
    peRatio: quote.trailingPE || null,
    dividendYield: (quote.dividendYield || 0) * 100,
    weekHigh52: quote.fiftyTwoWeekHigh || 0,
    weekLow52: quote.fiftyTwoWeekLow || 0,
  };
}

async function fetchFromYahoo(symbol: string): Promise<YahooQuoteResult | null> {
  const endpoints = [
    // Primary endpoint - v7 quote API
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
    // Fallback - v6 quote API
    `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${symbol}`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/',
  };

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        console.log(`Endpoint ${url} returned ${response.status}, trying next...`);
        continue;
      }

      const data: YahooFinanceResponse = await response.json();

      // Handle v7 response format
      if (data.quoteResponse?.result?.length) {
        const quote = data.quoteResponse.result[0];
        if (quote.regularMarketPrice) {
          return quote;
        }
      }

      // Handle v6 response format
      if (data.finance?.result?.[0]?.quotes?.length) {
        const quote = data.finance.result[0].quotes[0];
        if (quote.regularMarketPrice) {
          return quote;
        }
      }
    } catch (error) {
      console.log(`Error fetching from ${url}:`, error);
      continue;
    }
  }

  return null;
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
    const quote = await fetchFromYahoo(symbol.toUpperCase());

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Symbol not found or no data available' },
        { status: 404 }
      );
    }

    const asset = mapYahooToAsset(quote);
    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data from Yahoo Finance. The service may be temporarily unavailable.' },
      { status: 500 }
    );
  }
}
