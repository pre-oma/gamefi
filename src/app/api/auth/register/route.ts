import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, validatePassword, validateEmail, validateUsername } from '@/lib/auth';
import { User, UserCredentials, AuthResponse, DEFAULT_MAX_TEAMS } from '@/types';

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

    // Hash password
    const { hash, salt } = await hashPassword(password);

    // Generate IDs
    const userId = uuidv4();
    const credentialId = uuidv4();
    const now = new Date().toISOString();

    // Create user object
    const user: User = {
      id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      displayName: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: 'New investor on Gamefi Invest!',
      joinedAt: now,
      followers: [],
      following: [],
      portfolios: [],
      totalRewards: 0,
      badges: [],
      level: 1,
      xp: 0,
      maxTeams: DEFAULT_MAX_TEAMS,
    };

    // Create credentials object
    const credentials: UserCredentials = {
      id: credentialId,
      userId: userId,
      passwordHash: hash,
      salt: salt,
      createdAt: now,
      updatedAt: now,
    };

    // Return the created objects for client-side storage
    // Note: In a real app, this would be stored server-side in a database
    return NextResponse.json({
      success: true,
      user,
      credentials,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
