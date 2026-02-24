import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface ChallengeLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  wins: number;
  losses: number;
  draws: number;
  totalChallenges: number;
  winRate: number;
  xpEarned: number;
  sp500Wins: number;
  userWins: number;
}

// GET - Fetch challenge leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all'; // 'all', 'sp500', 'user'

    // Get all completed challenges
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('status', 'completed');

    if (type === 'sp500') {
      query = query.eq('type', 'sp500');
    } else if (type === 'user') {
      query = query.eq('type', 'user');
    }

    const { data: challenges, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
      });
    }

    // Aggregate stats per user
    const userStats = new Map<string, {
      wins: number;
      losses: number;
      draws: number;
      xpEarned: number;
      sp500Wins: number;
      userWins: number;
    }>();

    for (const challenge of challenges) {
      const challengerId = challenge.challenger_id;
      const opponentId = challenge.opponent_id;
      const winnerId = challenge.winner_id;
      const xpAwarded = challenge.xp_awarded || 0;
      const isSp500 = challenge.type === 'sp500';

      // Initialize stats for challenger
      if (!userStats.has(challengerId)) {
        userStats.set(challengerId, { wins: 0, losses: 0, draws: 0, xpEarned: 0, sp500Wins: 0, userWins: 0 });
      }

      const challengerStats = userStats.get(challengerId)!;

      if (winnerId === challengerId) {
        challengerStats.wins++;
        challengerStats.xpEarned += xpAwarded;
        if (isSp500) {
          challengerStats.sp500Wins++;
        } else {
          challengerStats.userWins++;
        }
      } else if (winnerId === null) {
        challengerStats.draws++;
      } else {
        challengerStats.losses++;
        challengerStats.xpEarned -= xpAwarded;
      }

      // For user challenges, also track opponent stats
      if (!isSp500 && opponentId) {
        if (!userStats.has(opponentId)) {
          userStats.set(opponentId, { wins: 0, losses: 0, draws: 0, xpEarned: 0, sp500Wins: 0, userWins: 0 });
        }

        const opponentStats = userStats.get(opponentId)!;

        if (winnerId === opponentId) {
          opponentStats.wins++;
          opponentStats.xpEarned += xpAwarded;
          opponentStats.userWins++;
        } else if (winnerId === null) {
          opponentStats.draws++;
        } else {
          opponentStats.losses++;
          opponentStats.xpEarned -= xpAwarded;
        }
      }
    }

    // Fetch user details for all users
    const userIds = Array.from(userStats.keys());
    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar')
      .in('id', userIds);

    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    // Build leaderboard entries
    const leaderboard: ChallengeLeaderboardEntry[] = [];

    for (const [userId, stats] of userStats) {
      const user = userMap.get(userId);
      if (!user) continue;

      const totalChallenges = stats.wins + stats.losses + stats.draws;
      const winRate = totalChallenges > 0 ? (stats.wins / totalChallenges) * 100 : 0;

      leaderboard.push({
        rank: 0,
        userId,
        username: user.username,
        avatar: user.avatar,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        totalChallenges,
        winRate,
        xpEarned: stats.xpEarned,
        sp500Wins: stats.sp500Wins,
        userWins: stats.userWins,
      });
    }

    // Sort by wins (primary), then win rate (secondary), then XP earned (tertiary)
    leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.xpEarned - a.xpEarned;
    });

    // Assign ranks and limit
    const rankedLeaderboard = leaderboard.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
      totalParticipants: leaderboard.length,
    });
  } catch (error) {
    console.error('Fetch challenge leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
