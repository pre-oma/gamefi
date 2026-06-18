import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSeasonState } from '@/lib/season';
import { SEASON_TOTAL_WEEKS } from '@/types';

/* GET /api/season — returns the global SeasonState computed from the
   singleton season_state row plus the current server time. Falls back
   to a Monday-anchored default if the row is missing (e.g. someone
   hasn't run supabase-season-features.sql yet) so the UI doesn't
   crash in dev. */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('season_state')
      .select('season_number, start_date, total_weeks')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Fallback: anchor to the most recent Monday so the clock still ticks.
      const now = new Date();
      const day = now.getUTCDay(); // 0=Sun..6=Sat
      const daysSinceMonday = (day + 6) % 7;
      const monday = new Date(now);
      monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
      const startDate = monday.toISOString().slice(0, 10);

      const state = getSeasonState({
        seasonNumber: 1,
        startDate,
        totalWeeks: SEASON_TOTAL_WEEKS,
      });
      return NextResponse.json({ success: true, seasonState: state, fallback: true });
    }

    const state = getSeasonState({
      seasonNumber: data.season_number,
      startDate: data.start_date,
      totalWeeks: data.total_weeks,
    });

    return NextResponse.json({ success: true, seasonState: state });
  } catch (err) {
    console.error('GET /api/season failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load season state' }, { status: 500 });
  }
}
