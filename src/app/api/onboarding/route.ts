import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const { data: onboarding, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching onboarding:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch onboarding status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hasCompleted: onboarding?.has_completed ?? false,
      currentStep: onboarding?.current_step ?? 0,
      skippedAt: onboarding?.skipped_at,
      completedAt: onboarding?.completed_at,
    });
  } catch (error) {
    console.error('Onboarding fetch error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST - Update onboarding status
export async function POST(request: NextRequest) {
  try {
    const { userId, completed, skipped, currentStep } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const updateData: any = {};

    if (completed !== undefined) {
      updateData.has_completed = completed;
      if (completed) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (skipped) {
      updateData.has_completed = true;
      updateData.skipped_at = new Date().toISOString();
    }

    if (currentStep !== undefined) {
      updateData.current_step = currentStep;
    }

    const { error } = await supabase
      .from('user_onboarding')
      .upsert({
        user_id: userId,
        ...updateData,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating onboarding:', error);
      return NextResponse.json({ success: false, error: 'Failed to update onboarding' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
