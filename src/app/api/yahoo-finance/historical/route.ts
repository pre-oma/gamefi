/* Public historical-price endpoint. Thin HTTP wrapper around the
   shared yahooHistorical lib so the same fetching logic powers both
   external clients (the /compare custom-symbol search, etc.) and
   internal server-side helpers (challenge performance computation).
   Splitting the lib out lets server-side code skip the HTTP round
   trip, which is essential on Vercel preview deployments where SSO
   protection would otherwise 401 the internal request. */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchYahooHistorical,
  HistoricalDataPoint,
} from '@/lib/yahooHistorical';

export type { HistoricalDataPoint };

export interface HistoricalDataResponse {
  success: boolean;
  symbol?: string;
  data?: HistoricalDataPoint[];
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe') || '1M';
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'Symbol parameter is required' },
      { status: 400 },
    );
  }

  const result = await fetchYahooHistorical({
    symbol,
    startDate,
    endDate,
    timeframe,
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error || 'Failed to fetch data' },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({
    success: true,
    symbol: symbol.toUpperCase(),
    data: result.data,
  });
}
