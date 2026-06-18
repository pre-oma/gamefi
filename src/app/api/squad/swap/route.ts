import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSeasonState, isWeekendWindowOpen } from '@/lib/season';
import {
  PortfolioPlayer,
  WEEKEND_SUB_MAX_PER_WEEKEND,
  WEEKEND_SUB_COST_XP,
  SEASON_TOTAL_WEEKS,
} from '@/types';

/* POST /api/squad/swap
   Body: { userId, portfolioId, starterSymbol, benchSymbol }
   - validates weekend window is open
   - validates user owns the portfolio
   - validates per-weekend swap cap (counts weekend_swaps for this gameweek)
   - finds the two players in portfolios.players JSON by symbol
   - swaps starter ↔ bench: starter goes to bench at 0%, bench comes on
     and inherits the starter's allocation
   - persists portfolios.players, inserts weekend_swaps row, deducts XP
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, portfolioId, starterSymbol, benchSymbol } = body as {
      userId?: string;
      portfolioId?: string;
      starterSymbol?: string;
      benchSymbol?: string;
    };

    if (!userId || !portfolioId || !starterSymbol || !benchSymbol) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (starterSymbol === benchSymbol) {
      return NextResponse.json(
        { success: false, error: 'Cannot swap a player with itself' },
        { status: 400 },
      );
    }

    // 1. Load season state (canonical clock)
    const { data: seasonRow } = await supabase
      .from('season_state')
      .select('season_number, start_date, total_weeks')
      .eq('id', 1)
      .single();

    const now = new Date();
    const seasonState = seasonRow
      ? getSeasonState(
          {
            seasonNumber: seasonRow.season_number,
            startDate: seasonRow.start_date,
            totalWeeks: seasonRow.total_weeks,
          },
          now,
        )
      : getSeasonState(
          {
            seasonNumber: 1,
            startDate: now.toISOString().slice(0, 10),
            totalWeeks: SEASON_TOTAL_WEEKS,
          },
          now,
        );

    if (!isWeekendWindowOpen(now)) {
      return NextResponse.json(
        { success: false, error: 'Weekend swap window is closed. Try again Fri 21:00 UTC – Mon 05:00 UTC.' },
        { status: 400 },
      );
    }

    // 2. Load portfolio and verify ownership
    const { data: portfolio, error: pErr } = await supabase
      .from('portfolios')
      .select('user_id, players')
      .eq('id', portfolioId)
      .single();

    if (pErr || !portfolio) {
      return NextResponse.json({ success: false, error: 'Portfolio not found' }, { status: 404 });
    }
    if (portfolio.user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const players: PortfolioPlayer[] = typeof portfolio.players === 'string'
      ? JSON.parse(portfolio.players)
      : portfolio.players;

    // 3. Per-weekend cap — count swaps in this gameweek + season
    const { count: swapCount } = await supabase
      .from('weekend_swaps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('portfolio_id', portfolioId)
      .eq('season_number', seasonState.seasonNumber)
      .eq('gameweek', seasonState.currentGameweek);

    if ((swapCount ?? 0) >= WEEKEND_SUB_MAX_PER_WEEKEND) {
      return NextResponse.json(
        { success: false, error: `Weekend swap cap reached (${WEEKEND_SUB_MAX_PER_WEEKEND}/weekend)` },
        { status: 400 },
      );
    }

    // 4. Locate starter and bench players in the JSON
    const starterIdx = players.findIndex(
      (p) => p.asset?.symbol === starterSymbol && !p.isBench,
    );
    const benchIdx = players.findIndex(
      (p) => p.asset?.symbol === benchSymbol && p.isBench,
    );

    if (starterIdx === -1) {
      return NextResponse.json(
        { success: false, error: `Starter ${starterSymbol} not found on starting XI` },
        { status: 400 },
      );
    }
    if (benchIdx === -1) {
      return NextResponse.json(
        { success: false, error: `Bench player ${benchSymbol} not found on bench` },
        { status: 400 },
      );
    }

    const starter = players[starterIdx];
    const bench = players[benchIdx];
    const inheritedAllocation = starter.allocation;

    // 5. Perform the swap. Bench player inherits the starter's
    //    position + allocation; starter moves to bench at 0%.
    const newStarter: PortfolioPlayer = {
      ...bench,
      positionId: starter.positionId,
      allocation: inheritedAllocation,
      isBench: false,
    };
    const newBench: PortfolioPlayer = {
      ...starter,
      positionId: bench.positionId,
      allocation: 0,
      isBench: true,
    };

    const updatedPlayers = [...players];
    updatedPlayers[starterIdx] = newStarter;
    updatedPlayers[benchIdx] = newBench;

    // 6. Load current XP for the user
    const { data: dbUser, error: uErr } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();
    if (uErr || !dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (dbUser.xp < WEEKEND_SUB_COST_XP) {
      return NextResponse.json(
        { success: false, error: `Not enough XP. Need ${WEEKEND_SUB_COST_XP} XP per sub.` },
        { status: 400 },
      );
    }
    const newXp = dbUser.xp - WEEKEND_SUB_COST_XP;

    // 7. Persist all three writes. Not transactional — if a later
    //    write fails we leave a partial state, same as the existing
    //    challenges flow.
    const { error: writePErr } = await supabase
      .from('portfolios')
      .update({
        players: JSON.stringify(updatedPlayers),
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioId);
    if (writePErr) {
      return NextResponse.json({ success: false, error: writePErr.message }, { status: 500 });
    }

    const { error: logErr } = await supabase.from('weekend_swaps').insert({
      user_id: userId,
      portfolio_id: portfolioId,
      gameweek: seasonState.currentGameweek,
      season_number: seasonState.seasonNumber,
      starter_symbol: starterSymbol,
      bench_symbol: benchSymbol,
      xp_cost: WEEKEND_SUB_COST_XP,
    });
    if (logErr) {
      console.error('weekend_swaps insert failed:', logErr);
    }

    const { error: xpErr } = await supabase
      .from('users')
      .update({ xp: newXp, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (xpErr) {
      console.error('xp deduct failed:', xpErr);
    }

    return NextResponse.json({
      success: true,
      players: updatedPlayers,
      xp: newXp,
      swapsUsedThisWeekend: (swapCount ?? 0) + 1,
      swapsRemaining: WEEKEND_SUB_MAX_PER_WEEKEND - ((swapCount ?? 0) + 1),
    });
  } catch (err) {
    console.error('POST /api/squad/swap failed:', err);
    return NextResponse.json({ success: false, error: 'Swap failed' }, { status: 500 });
  }
}
