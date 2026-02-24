import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TEAM_SLOT_UNLOCK_COST } from '@/types';

// GET - Fetch user by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get followers, following, portfolios, badges
    const [followers, following, portfolios, badges] = await Promise.all([
      supabase.from('followers').select('follower_id').eq('following_id', userId),
      supabase.from('followers').select('following_id').eq('follower_id', userId),
      supabase.from('portfolios').select('id').eq('user_id', userId),
      supabase.from('badges').select('*').eq('user_id', userId),
    ]);

    const user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      displayName: dbUser.display_name,
      avatar: dbUser.avatar,
      bio: dbUser.bio,
      joinedAt: dbUser.joined_at,
      followers: followers.data?.map(f => f.follower_id) || [],
      following: following.data?.map(f => f.following_id) || [],
      portfolios: portfolios.data?.map(p => p.id) || [],
      totalRewards: dbUser.total_rewards,
      badges: badges.data?.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        earnedAt: b.earned_at,
      })) || [],
      level: dbUser.level,
      xp: dbUser.xp,
      maxTeams: dbUser.max_teams,
    };

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Fetch user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, displayName, bio, avatar, xp, level, maxTeams, totalRewards } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (displayName !== undefined) updateData.display_name = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (xp !== undefined) updateData.xp = xp;
    if (level !== undefined) updateData.level = level;
    if (maxTeams !== undefined) updateData.max_teams = maxTeams;
    if (totalRewards !== undefined) updateData.total_rewards = totalRewards;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// POST - Unlock team slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    if (action === 'unlockTeamSlot') {
      // Get current user
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('xp, max_teams')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      if (user.xp < TEAM_SLOT_UNLOCK_COST) {
        return NextResponse.json(
          { success: false, error: 'Not enough XP to unlock team slot' },
          { status: 400 }
        );
      }

      // Update user
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          xp: user.xp - TEAM_SLOT_UNLOCK_COST,
          max_teams: (user.max_teams || 3) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        xp: updated.xp,
        maxTeams: updated.max_teams,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json({ success: false, error: 'Action failed' }, { status: 500 });
  }
}
