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
  quoteResponse: {
    result: YahooQuoteResult[];
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
    dividendYield: (quote.dividendYield || 0) * 100, // Convert from decimal to percentage
    weekHigh52: quote.fiftyTwoWeekHigh || 0,
    weekLow52: quote.fiftyTwoWeekLow || 0,
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
    const yahooUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol.toUpperCase())}`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned ${response.status}`);
    }

    const data: YahooFinanceResponse = await response.json();

    if (data.quoteResponse.error) {
      return NextResponse.json(
        { success: false, error: data.quoteResponse.error.description },
        { status: 400 }
      );
    }

    const results = data.quoteResponse.result;

    if (!results || results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symbol not found' },
        { status: 404 }
      );
    }

    const quote = results[0];

    // Check if we got a valid quote with price data
    if (!quote.regularMarketPrice) {
      return NextResponse.json(
        { success: false, error: 'No price data available for this symbol' },
        { status: 404 }
      );
    }

    const asset = mapYahooToAsset(quote);

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data from Yahoo Finance' },
      { status: 500 }
    );
  }
}
