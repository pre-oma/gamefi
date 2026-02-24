import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CHALLENGE_XP, Portfolio } from '@/types';
import {
  fetchSP500ReturnForPeriod,
  calculatePortfolioReturnForPeriod,
  formatDateString,
} from '@/lib/challengePerformance';

// Secret key for cron authentication (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || '';

// Get base URL for internal API calls
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

/**
 * Cron endpoint for auto-settling challenges
 *
 * This endpoint can be called by:
 * - Vercel Cron Jobs (vercel.json configuration)
 * - External cron services (e.g., cron-job.org, EasyCron)
 * - GitHub Actions scheduled workflows
 *
 * Example Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/settle-challenges",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * For security, set CRON_SECRET environment variable and pass it as Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const baseUrl = getBaseUrl(request);

    // Find all active challenges that have ended
    const { data: challenges, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .lte('end_date', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching challenges:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No challenges to settle',
        settledCount: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Found ${challenges.length} challenges to settle`);

    const results = {
      settled: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const challenge of challenges) {
      try {
        const startDate = challenge.start_date?.split('T')[0] || formatDateString(new Date());
        const endDate = challenge.end_date?.split('T')[0] || formatDateString(new Date());

        // Fetch and calculate challenger return
        let challengerReturnPercent = 0;
        const { data: challengerPortfolioData } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', challenge.challenger_portfolio_id)
          .single();

        if (challengerPortfolioData) {
          const challengerPortfolio: Portfolio = {
            id: challengerPortfolioData.id,
            userId: challengerPortfolioData.user_id,
            name: challengerPortfolioData.name,
            description: challengerPortfolioData.description,
            formation: challengerPortfolioData.formation,
            players: typeof challengerPortfolioData.players === 'string'
              ? JSON.parse(challengerPortfolioData.players)
              : challengerPortfolioData.players,
            createdAt: challengerPortfolioData.created_at,
            updatedAt: challengerPortfolioData.updated_at,
            isPublic: challengerPortfolioData.is_public,
            likes: [],
            clonedFrom: challengerPortfolioData.cloned_from,
            cloneCount: challengerPortfolioData.clone_count,
            tags: challengerPortfolioData.tags || [],
          };

          challengerReturnPercent = await calculatePortfolioReturnForPeriod(
            challengerPortfolio,
            startDate,
            endDate,
            baseUrl
          );
        }

        // Calculate opponent return
        let opponentReturnPercent = 0;
        if (challenge.type === 'sp500') {
          opponentReturnPercent = await fetchSP500ReturnForPeriod(startDate, endDate, baseUrl);
        } else if (challenge.opponent_portfolio_id) {
          const { data: opponentPortfolioData } = await supabase
            .from('portfolios')
            .select('*')
            .eq('id', challenge.opponent_portfolio_id)
            .single();

          if (opponentPortfolioData) {
            const opponentPortfolio: Portfolio = {
              id: opponentPortfolioData.id,
              userId: opponentPortfolioData.user_id,
              name: opponentPortfolioData.name,
              description: opponentPortfolioData.description,
              formation: opponentPortfolioData.formation,
              players: typeof opponentPortfolioData.players === 'string'
                ? JSON.parse(opponentPortfolioData.players)
                : opponentPortfolioData.players,
              createdAt: opponentPortfolioData.created_at,
              updatedAt: opponentPortfolioData.updated_at,
              isPublic: opponentPortfolioData.is_public,
              likes: [],
              clonedFrom: opponentPortfolioData.cloned_from,
              cloneCount: opponentPortfolioData.clone_count,
              tags: opponentPortfolioData.tags || [],
            };

            opponentReturnPercent = await calculatePortfolioReturnForPeriod(
              opponentPortfolio,
              startDate,
              endDate,
              baseUrl
            );
          }
        }

        // Determine winner
        let winnerId: string | null = null;
        let xpAwarded = 0;

        if (challengerReturnPercent > opponentReturnPercent) {
          winnerId = challenge.challenger_id;
          xpAwarded = challenge.type === 'sp500' ? CHALLENGE_XP.VS_SP500 : CHALLENGE_XP.VS_USER;
        } else if (opponentReturnPercent > challengerReturnPercent) {
          winnerId = challenge.type === 'sp500' ? 'sp500' : challenge.opponent_id;
          xpAwarded = challenge.type === 'sp500' ? CHALLENGE_XP.VS_SP500 : CHALLENGE_XP.VS_USER;
        }

        // Calculate end values
        const challengerEndValue = (challenge.challenger_start_value || 10000) * (1 + challengerReturnPercent / 100);
        const opponentEndValue = (challenge.opponent_start_value || 10000) * (1 + opponentReturnPercent / 100);

        // Update challenge
        const { error: updateError } = await supabase
          .from('challenges')
          .update({
            status: 'completed',
            challenger_end_value: challengerEndValue,
            opponent_end_value: opponentEndValue,
            challenger_return_percent: challengerReturnPercent,
            opponent_return_percent: opponentReturnPercent,
            winner_id: winnerId,
            xp_awarded: xpAwarded,
            settled_at: new Date().toISOString(),
          })
          .eq('id', challenge.id);

        if (updateError) {
          results.failed.push({ id: challenge.id, error: updateError.message });
          continue;
        }

        // Update XP for participants
        if (xpAwarded > 0) {
          if (challenge.type === 'sp500') {
            const xpChange = winnerId === challenge.challenger_id ? xpAwarded : -xpAwarded;
            await updateUserXP(challenge.challenger_id, xpChange);
            await createNotification(
              challenge.challenger_id,
              winnerId === challenge.challenger_id ? 'challenge_won' : 'challenge_lost',
              challenge.id,
              Math.abs(xpChange),
              'S&P 500'
            );
          } else if (winnerId) {
            await updateUserXP(challenge.challenger_id, winnerId === challenge.challenger_id ? xpAwarded : -xpAwarded);
            await updateUserXP(challenge.opponent_id, winnerId === challenge.opponent_id ? xpAwarded : -xpAwarded);

            const { data: winnerData } = await supabase
              .from('users')
              .select('username')
              .eq('id', winnerId)
              .single();

            await createNotification(
              challenge.challenger_id,
              winnerId === challenge.challenger_id ? 'challenge_won' : 'challenge_lost',
              challenge.id,
              xpAwarded,
              winnerData?.username || 'opponent'
            );
            await createNotification(
              challenge.opponent_id,
              winnerId === challenge.opponent_id ? 'challenge_won' : 'challenge_lost',
              challenge.id,
              xpAwarded,
              winnerData?.username || 'opponent'
            );
          }
        }

        results.settled.push(challenge.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.failed.push({ id: challenge.id, error: errorMessage });
      }
    }

    console.log(`Settled ${results.settled.length} challenges, ${results.failed.length} failed`);

    return NextResponse.json({
      success: true,
      message: `Settled ${results.settled.length} challenge(s)`,
      settledCount: results.settled.length,
      failedCount: results.failed.length,
      settled: results.settled,
      failed: results.failed.length > 0 ? results.failed : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron settle challenges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to settle challenges' },
      { status: 500 }
    );
  }
}

// Helper to update user XP
async function updateUserXP(userId: string, xpChange: number): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('xp')
    .eq('id', userId)
    .single();

  if (user) {
    const newXp = Math.max(0, (user.xp || 0) + xpChange);
    await supabase
      .from('users')
      .update({ xp: newXp, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }
}

// Helper to create notification
async function createNotification(
  userId: string,
  type: 'challenge_won' | 'challenge_lost',
  challengeId: string,
  xpAmount: number,
  opponentName: string
): Promise<void> {
  const message = type === 'challenge_won'
    ? `You won your challenge against ${opponentName}! +${xpAmount} XP`
    : `You lost your challenge against ${opponentName}. -${xpAmount} XP`;

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
    data: { challengeId, xpAmount },
  });
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
