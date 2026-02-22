import { NextRequest, NextResponse } from 'next/server';

interface YahooQuoteSummaryResponse {
  quoteSummary: {
    result: Array<{
      summaryDetail?: {
        trailingPE?: { raw: number };
        forwardPE?: { raw: number };
        priceToBook?: { raw: number };
        dividendYield?: { raw: number };
        payoutRatio?: { raw: number };
        beta?: { raw: number };
        marketCap?: { raw: number };
        fiftyTwoWeekHigh?: { raw: number };
        fiftyTwoWeekLow?: { raw: number };
      };
      defaultKeyStatistics?: {
        trailingEps?: { raw: number };
        forwardEps?: { raw: number };
        pegRatio?: { raw: number };
        beta?: { raw: number };
        priceToBook?: { raw: number };
        enterpriseValue?: { raw: number };
        enterpriseToRevenue?: { raw: number };
        enterpriseToEbitda?: { raw: number };
      };
      financialData?: {
        returnOnEquity?: { raw: number };
        returnOnAssets?: { raw: number };
        profitMargins?: { raw: number };
        operatingMargins?: { raw: number };
        grossMargins?: { raw: number };
        debtToEquity?: { raw: number };
        currentRatio?: { raw: number };
        quickRatio?: { raw: number };
        revenueGrowth?: { raw: number };
        earningsGrowth?: { raw: number };
        currentPrice?: { raw: number };
      };
      assetProfile?: {
        sector?: string;
        industry?: string;
        longBusinessSummary?: string;
        fullTimeEmployees?: number;
        country?: string;
        website?: string;
      };
    }> | null;
    error: null | { code: string; description: string };
  };
}

// Cache for crumb and cookies
let cachedCrumb: { crumb: string; cookies: string; timestamp: number } | null = null;
const CRUMB_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getCrumb(): Promise<{ crumb: string; cookies: string } | null> {
  // Check if we have a valid cached crumb
  if (cachedCrumb && Date.now() - cachedCrumb.timestamp < CRUMB_CACHE_DURATION) {
    return { crumb: cachedCrumb.crumb, cookies: cachedCrumb.cookies };
  }

  try {
    // First, get cookies from Yahoo Finance
    const initResponse = await fetch('https://fc.yahoo.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const setCookieHeader = initResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      console.error('No cookies received from Yahoo Finance');
      return null;
    }

    // Extract relevant cookies
    const cookies = setCookieHeader
      .split(',')
      .map(cookie => cookie.split(';')[0].trim())
      .filter(cookie => cookie.includes('='))
      .join('; ');

    // Now fetch the crumb using the cookies
    const crumbResponse = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookies,
      },
    });

    if (!crumbResponse.ok) {
      console.error('Failed to get crumb:', crumbResponse.status);
      return null;
    }

    const crumb = await crumbResponse.text();
    if (!crumb || crumb.length === 0) {
      console.error('Empty crumb received');
      return null;
    }

    // Cache the crumb
    cachedCrumb = { crumb, cookies, timestamp: Date.now() };
    return { crumb, cookies };
  } catch (error) {
    console.error('Error getting crumb:', error);
    return null;
  }
}

export interface FundamentalsData {
  symbol: string;
  // Valuation metrics
  peRatio: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  pegRatio: number | null;
  // Earnings metrics
  eps: number | null;
  forwardEps: number | null;
  // Profitability metrics
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  // Financial health
  debtToEquity: number | null;
  currentRatio: number | null;
  // Risk metrics
  beta: number | null;
  // Growth metrics
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  // Market data
  marketCap: number | null;
  dividendYield: number | null;
  // Classification
  sector: string | null;
  industry: string | null;
}

function extractRaw(field: { raw: number } | undefined): number | null {
  return field?.raw ?? null;
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

  // Validate symbol format
  const symbolRegex = /^[A-Za-z0-9.\-]{1,10}$/;
  if (!symbolRegex.test(symbol)) {
    return NextResponse.json(
      { success: false, error: 'Invalid symbol format' },
      { status: 400 }
    );
  }

  try {
    const upperSymbol = symbol.toUpperCase();

    // Get crumb and cookies for authentication
    const auth = await getCrumb();
    if (!auth) {
      console.error('Failed to obtain Yahoo Finance authentication');
      return NextResponse.json(
        { success: false, error: 'Failed to authenticate with Yahoo Finance' },
        { status: 500 }
      );
    }

    const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(upperSymbol)}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': auth.cookies,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Yahoo Finance quoteSummary API returned ${response.status}`);
      return NextResponse.json(
        { success: false, error: 'Symbol not found' },
        { status: 404 }
      );
    }

    const data: YahooQuoteSummaryResponse = await response.json();

    if (data.quoteSummary.error) {
      console.error('Yahoo Finance quoteSummary API error:', data.quoteSummary.error);
      return NextResponse.json(
        { success: false, error: data.quoteSummary.error.description || 'Symbol not found' },
        { status: 404 }
      );
    }

    if (!data.quoteSummary.result || data.quoteSummary.result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data available for this symbol' },
        { status: 404 }
      );
    }

    const result = data.quoteSummary.result[0];
    const summaryDetail = result.summaryDetail;
    const keyStats = result.defaultKeyStatistics;
    const financialData = result.financialData;
    const assetProfile = result.assetProfile;

    const fundamentals: FundamentalsData = {
      symbol: upperSymbol,
      // Valuation
      peRatio: extractRaw(summaryDetail?.trailingPE),
      forwardPE: extractRaw(summaryDetail?.forwardPE),
      priceToBook: extractRaw(summaryDetail?.priceToBook) ?? extractRaw(keyStats?.priceToBook),
      pegRatio: extractRaw(keyStats?.pegRatio),
      // Earnings
      eps: extractRaw(keyStats?.trailingEps),
      forwardEps: extractRaw(keyStats?.forwardEps),
      // Profitability
      returnOnEquity: extractRaw(financialData?.returnOnEquity),
      returnOnAssets: extractRaw(financialData?.returnOnAssets),
      profitMargin: extractRaw(financialData?.profitMargins),
      operatingMargin: extractRaw(financialData?.operatingMargins),
      grossMargin: extractRaw(financialData?.grossMargins),
      // Financial health
      debtToEquity: extractRaw(financialData?.debtToEquity),
      currentRatio: extractRaw(financialData?.currentRatio),
      // Risk
      beta: extractRaw(summaryDetail?.beta) ?? extractRaw(keyStats?.beta),
      // Growth
      revenueGrowth: extractRaw(financialData?.revenueGrowth),
      earningsGrowth: extractRaw(financialData?.earningsGrowth),
      // Market
      marketCap: extractRaw(summaryDetail?.marketCap),
      dividendYield: extractRaw(summaryDetail?.dividendYield),
      // Classification
      sector: assetProfile?.sector ?? null,
      industry: assetProfile?.industry ?? null,
    };

    return NextResponse.json({ success: true, fundamentals });
  } catch (error) {
    console.error('Yahoo Finance fundamentals API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fundamentals data' },
      { status: 500 }
    );
  }
}
