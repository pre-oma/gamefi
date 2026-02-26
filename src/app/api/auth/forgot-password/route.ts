import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ForgotPasswordRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we don't want to reveal that
    if (userError || !user) {
      console.log('Password reset requested for non-existent email:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Try to create the password_reset_tokens table if it doesn't exist
    // Store reset token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      // Table might not exist - log for now, but return success to prevent enumeration
      console.log('Password reset token storage failed (table may not exist):', insertError);
      console.log('Reset token for', email, ':', resetToken);

      // For demo purposes, return the token in the response
      // In production, this would be sent via email only
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        // DEMO ONLY - Remove in production
        demo_token: resetToken,
        demo_note: 'In production, this token would be sent via email. Use this URL: /reset-password?token=' + resetToken,
      });
    }

    // In production, send email with reset link
    // For demo, we'll just log it and return success
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    // TODO: Send email in production
    // await sendEmail({
    //   to: email,
    //   subject: 'Reset your Gamefi Invest password',
    //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    // });

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // DEMO ONLY - Remove in production
      demo_token: resetToken,
      demo_note: 'In production, this token would be sent via email. Use this URL: /reset-password?token=' + resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
