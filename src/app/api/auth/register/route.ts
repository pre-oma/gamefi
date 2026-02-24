import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, validatePassword, validateEmail, validateUsername } from '@/lib/auth';
import { AuthResponse, DEFAULT_MAX_TEAMS } from '@/types';
import { supabase } from '@/lib/supabase';

interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();
    const { username, email, password } = body;

    // Validate inputs
    const usernameError = validateUsername(username);
    if (usernameError) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: usernameError },
        { status: 400 }
      );
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: emailError },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: passwordError },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username.toLowerCase()},email.eq.${email.toLowerCase()}`)
      .single();

    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const { hash, salt } = await hashPassword(password);

    // Generate user ID
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Insert user into database
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        display_name: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: 'New investor on Gamefi Invest!',
        joined_at: now,
        total_rewards: 0,
        level: 1,
        xp: 0,
        max_teams: DEFAULT_MAX_TEAMS,
      })
      .select()
      .single();

    if (userError) {
      console.error('User insert error:', userError);
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Insert credentials
    const { error: credError } = await supabase
      .from('user_credentials')
      .insert({
        id: uuidv4(),
        user_id: userId,
        password_hash: hash,
        salt: salt,
      });

    if (credError) {
      console.error('Credentials insert error:', credError);
      // Rollback user creation
      await supabase.from('users').delete().eq('id', userId);
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Failed to create user credentials' },
        { status: 500 }
      );
    }

    // Convert database user to app user format
    const user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.display_name,
      avatar: newUser.avatar,
      bio: newUser.bio,
      joinedAt: newUser.joined_at,
      followers: [],
      following: [],
      portfolios: [],
      totalRewards: newUser.total_rewards,
      badges: [],
      level: newUser.level,
      xp: newUser.xp,
      maxTeams: newUser.max_teams,
    };

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
