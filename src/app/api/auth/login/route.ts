import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { AuthResponse } from '@/types';
import { supabase } from '@/lib/supabase';

interface LoginRequestBody {
  identifier: string; // username or email
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequestBody = await request.json();
    const { identifier, password } = body;

    // Validate inputs
    if (!identifier || !identifier.trim()) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Username or email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Find user by username or email
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${normalizedIdentifier},email.eq.${normalizedIdentifier}`)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Get credentials
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', dbUser.id)
      .single();

    if (credError || !credentials) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      credentials.password_hash,
      credentials.salt
    );

    if (!isValidPassword) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Get user's followers
    const { data: followers } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', dbUser.id);

    // Get user's following
    const { data: following } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', dbUser.id);

    // Get user's portfolios
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', dbUser.id);

    // Get user's badges
    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', dbUser.id);

    // Convert database user to app user format
    const user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      displayName: dbUser.display_name,
      avatar: dbUser.avatar,
      bio: dbUser.bio,
      joinedAt: dbUser.joined_at,
      followers: followers?.map(f => f.follower_id) || [],
      following: following?.map(f => f.following_id) || [],
      portfolios: portfolios?.map(p => p.id) || [],
      totalRewards: dbUser.total_rewards,
      badges: badges?.map(b => ({
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

    return NextResponse.json<AuthResponse>({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
