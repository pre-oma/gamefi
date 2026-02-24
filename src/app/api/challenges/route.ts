import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import {
  Challenge,
  ChallengeType,
  ChallengeStatus,
  ChallengeTimeframe,
  NotificationType,
  CHALLENGE_XP,
  MAX_ACTIVE_CHALLENGES,
  CHALLENGE_TIMEFRAMES,
} from '@/types';

// Helper to create notification
async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      id: uuidv4(),
      user_id: userId,
      type,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
      data: data || {},
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

// Helper to convert DB record to Challenge
function dbToChallenge(db: Record<string, unknown>): Challenge {
  return {
    id: db.id as string,
    type: db.type as ChallengeType,
    status: db.status as ChallengeStatus,
    challengerId: db.challenger_id as string,
    challengerPortfolioId: db.challenger_portfolio_id as string,
    opponentId: db.opponent_id as string | null,
    opponentPortfolioId: db.opponent_portfolio_id as string | null,
    timeframe: db.timeframe as ChallengeTimeframe,
    startDate: db.start_date as string | null,
    endDate: db.end_date as string | null,
    challengerStartValue: db.challenger_start_value as number | null,
    challengerEndValue: db.challenger_end_value as number | null,
    opponentStartValue: db.opponent_start_value as number | null,
    opponentEndValue: db.opponent_end_value as number | null,
    challengerReturnPercent: db.challenger_return_percent as number | null,
    opponentReturnPercent: db.opponent_return_percent as number | null,
    winnerId: db.winner_id as string | null,
    xpAwarded: db.xp_awarded as number | null,
    createdAt: db.created_at as string,
    settledAt: db.settled_at as string | null,
  };
}

// GET - Fetch challenges for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    // Fetch challenges where user is either challenger or opponent
    let query = supabase
      .from('challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: challenges, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch user and portfolio details for each challenge
    const formattedChallenges: Challenge[] = [];

    for (const c of challenges || []) {
      const challenge = dbToChallenge(c);

      // Get challenger details
      const { data: challenger } = await supabase
        .from('users')
        .select('username, avatar')
        .eq('id', challenge.challengerId)
        .single();

      const { data: challengerPortfolio } = await supabase
        .from('portfolios')
        .select('name')
        .eq('id', challenge.challengerPortfolioId)
        .single();

      challenge.challengerUsername = challenger?.username;
      challenge.challengerAvatar = challenger?.avatar;
      challenge.challengerPortfolioName = challengerPortfolio?.name;

      // Get opponent details if user challenge
      if (challenge.opponentId) {
        const { data: opponent } = await supabase
          .from('users')
          .select('username, avatar')
          .eq('id', challenge.opponentId)
          .single();

        challenge.opponentUsername = opponent?.username;
        challenge.opponentAvatar = opponent?.avatar;

        if (challenge.opponentPortfolioId) {
          const { data: opponentPortfolio } = await supabase
            .from('portfolios')
            .select('name')
            .eq('id', challenge.opponentPortfolioId)
            .single();
          challenge.opponentPortfolioName = opponentPortfolio?.name;
        }
      } else if (challenge.type === 'sp500') {
        challenge.opponentUsername = 'S&P 500';
        challenge.opponentAvatar = '/sp500-logo.png';
        challenge.opponentPortfolioName = 'SPY Index';
      }

      formattedChallenges.push(challenge);
    }

    // Separate pending invites (where user is the opponent and status is pending)
    const pendingInvites = formattedChallenges.filter(
      (c) => c.status === 'pending' && c.opponentId === userId
    );

    const activeChallenges = formattedChallenges.filter(
      (c) => c.status === 'active'
    );

    const completedChallenges = formattedChallenges.filter(
      (c) => c.status === 'completed'
    );

    return NextResponse.json({
      success: true,
      challenges: formattedChallenges,
      pendingInvites,
      activeChallenges,
      completedChallenges,
    });
  } catch (error) {
    console.error('Fetch challenges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST - Create a new challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      challengerId,
      challengerPortfolioId,
      type,
      timeframe,
      opponentId,
      opponentPortfolioId,
    } = body as {
      challengerId: string;
      challengerPortfolioId: string;
      type: ChallengeType;
      timeframe: ChallengeTimeframe;
      opponentId?: string;
      opponentPortfolioId?: string;
    };

    // Validate required fields
    if (!challengerId || !challengerPortfolioId || !type || !timeframe) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'sp500' && type !== 'user') {
      return NextResponse.json(
        { success: false, error: 'Invalid challenge type' },
        { status: 400 }
      );
    }

    // User challenges require opponent
    if (type === 'user' && (!opponentId || !opponentPortfolioId)) {
      return NextResponse.json(
        { success: false, error: 'User challenges require an opponent' },
        { status: 400 }
      );
    }

    // Get user's current XP and active challenge count
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', challengerId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Count active challenges (pending + active)
    const { count, error: countError } = await supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .or(`challenger_id.eq.${challengerId},opponent_id.eq.${challengerId}`)
      .in('status', ['pending', 'active']);

    if (countError) {
      return NextResponse.json(
        { success: false, error: 'Failed to check active challenges' },
        { status: 500 }
      );
    }

    if ((count || 0) >= MAX_ACTIVE_CHALLENGES) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_ACTIVE_CHALLENGES} active challenges allowed`,
        },
        { status: 400 }
      );
    }

    // Check XP requirement
    const requiredXp = type === 'sp500' ? CHALLENGE_XP.VS_SP500 : CHALLENGE_XP.VS_USER;
    if (user.xp < requiredXp) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient XP. Need ${requiredXp} XP to cover potential loss.`,
        },
        { status: 400 }
      );
    }

    // Calculate dates
    const now = new Date();
    const timeframeDays = CHALLENGE_TIMEFRAMES.find((t) => t.value === timeframe)?.days || 7;
    const endDate = new Date(now.getTime() + timeframeDays * 24 * 60 * 60 * 1000);

    // For S&P 500 challenges, start immediately
    // For user challenges, wait for acceptance (pending)
    const isSp500 = type === 'sp500';
    const status: ChallengeStatus = isSp500 ? 'active' : 'pending';
    const startDate = isSp500 ? now.toISOString() : null;
    const calculatedEndDate = isSp500 ? endDate.toISOString() : null;

    // Create challenge
    const challengeId = uuidv4();
    const { data: newChallenge, error: insertError } = await supabase
      .from('challenges')
      .insert({
        id: challengeId,
        type,
        status,
        challenger_id: challengerId,
        challenger_portfolio_id: challengerPortfolioId,
        opponent_id: type === 'user' ? opponentId : null,
        opponent_portfolio_id: type === 'user' ? opponentPortfolioId : null,
        timeframe,
        start_date: startDate,
        end_date: calculatedEndDate,
        challenger_start_value: isSp500 ? 10000 : null, // Will be calculated from portfolio
        opponent_start_value: isSp500 ? 10000 : null,
        created_at: now.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    const challenge = dbToChallenge(newChallenge);

    // Send notification to opponent for user challenges
    if (type === 'user' && opponentId) {
      const { data: challenger } = await supabase
        .from('users')
        .select('username')
        .eq('id', challengerId)
        .single();

      await createNotification(
        opponentId,
        'challenge_received',
        `${challenger?.username || 'Someone'} has challenged you to a portfolio battle!`,
        { challengeId: challenge.id, challengerId }
      );
    }

    return NextResponse.json({
      success: true,
      challenge,
      message: isSp500
        ? 'Challenge started! Track your performance against the S&P 500.'
        : 'Challenge sent! Waiting for opponent to accept.',
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}

// PUT - Accept, decline, or cancel a challenge
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, action, userId, portfolioId } = body as {
      challengeId: string;
      action: 'accept' | 'decline' | 'cancel';
      userId: string;
      portfolioId?: string;
    };

    if (!challengeId || !action || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Validate action based on user role
    const isChallenger = challenge.challenger_id === userId;
    const isOpponent = challenge.opponent_id === userId;

    if (!isChallenger && !isOpponent) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to modify this challenge' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Only opponent can accept
      if (!isOpponent) {
        return NextResponse.json(
          { success: false, error: 'Only the opponent can accept a challenge' },
          { status: 403 }
        );
      }

      if (challenge.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Challenge is not pending' },
          { status: 400 }
        );
      }

      // Check opponent's XP
      const { data: opponent } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single();

      if (!opponent || opponent.xp < CHALLENGE_XP.VS_USER) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient XP. Need ${CHALLENGE_XP.VS_USER} XP to accept.`,
          },
          { status: 400 }
        );
      }

      // Check opponent's active challenge count
      const { count } = await supabase
        .from('challenges')
        .select('id', { count: 'exact', head: true })
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .in('status', ['pending', 'active']);

      if ((count || 0) >= MAX_ACTIVE_CHALLENGES) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum ${MAX_ACTIVE_CHALLENGES} active challenges allowed`,
          },
          { status: 400 }
        );
      }

      // Calculate start and end dates
      const now = new Date();
      const timeframeDays =
        CHALLENGE_TIMEFRAMES.find((t) => t.value === challenge.timeframe)?.days || 7;
      const endDate = new Date(now.getTime() + timeframeDays * 24 * 60 * 60 * 1000);

      // Update challenge to active
      const { data: updated, error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'active',
          opponent_portfolio_id: portfolioId || challenge.opponent_portfolio_id,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          challenger_start_value: 10000,
          opponent_start_value: 10000,
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // Notify challenger that challenge was accepted
      const { data: accepter } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      await createNotification(
        challenge.challenger_id,
        'challenge_accepted',
        `${accepter?.username || 'Your opponent'} accepted your challenge! The competition begins now.`,
        { challengeId: challenge.id }
      );

      return NextResponse.json({
        success: true,
        challenge: dbToChallenge(updated),
        message: 'Challenge accepted! The competition has begun.',
      });
    }

    if (action === 'decline') {
      // Only opponent can decline
      if (!isOpponent) {
        return NextResponse.json(
          { success: false, error: 'Only the opponent can decline a challenge' },
          { status: 403 }
        );
      }

      if (challenge.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Challenge is not pending' },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // Notify challenger that challenge was declined
      const { data: decliner } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      await createNotification(
        challenge.challenger_id,
        'challenge_declined',
        `${decliner?.username || 'Your opponent'} declined your challenge.`,
        { challengeId: challenge.id }
      );

      return NextResponse.json({
        success: true,
        challenge: dbToChallenge(updated),
        message: 'Challenge declined.',
      });
    }

    if (action === 'cancel') {
      // Only challenger can cancel, and only if pending
      if (!isChallenger) {
        return NextResponse.json(
          { success: false, error: 'Only the challenger can cancel' },
          { status: 403 }
        );
      }

      if (challenge.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Can only cancel pending challenges' },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('challenges')
        .update({ status: 'cancelled' })
        .eq('id', challengeId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        challenge: dbToChallenge(updated),
        message: 'Challenge cancelled.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}
