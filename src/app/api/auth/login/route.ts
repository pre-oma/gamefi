import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { User, UserCredentials, AuthResponse } from '@/types';

interface LoginRequestBody {
  identifier: string; // username or email
  password: string;
  // Since localStorage isn't available server-side, client sends stored data
  storedUser?: User;
  storedCredentials?: UserCredentials;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequestBody = await request.json();
    const { identifier, password, storedUser, storedCredentials } = body;

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

    // Check if user and credentials were provided
    if (!storedUser || !storedCredentials) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Verify the identifier matches the user
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const matchesUsername = storedUser.username.toLowerCase() === normalizedIdentifier;
    const matchesEmail = storedUser.email.toLowerCase() === normalizedIdentifier;

    if (!matchesUsername && !matchesEmail) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      storedCredentials.passwordHash,
      storedCredentials.salt
    );

    if (!isValidPassword) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Password verified, return success with user
    return NextResponse.json<AuthResponse>({
      success: true,
      user: storedUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
