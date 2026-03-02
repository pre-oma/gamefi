-- ============================================
-- COMPLETE RLS FIX FOR CHALLENGES & NOTIFICATIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX CHALLENGES TABLE RLS
-- ============================================

-- Enable RLS (if not already)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on challenges
DROP POLICY IF EXISTS "Allow all operations for anon users" ON challenges;
DROP POLICY IF EXISTS "challenges_select_policy" ON challenges;
DROP POLICY IF EXISTS "challenges_insert_policy" ON challenges;
DROP POLICY IF EXISTS "challenges_update_policy" ON challenges;
DROP POLICY IF EXISTS "challenges_delete_policy" ON challenges;
DROP POLICY IF EXISTS "Users can view their challenges" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update their challenges" ON challenges;

-- Create permissive policy for server-side API access
CREATE POLICY "challenges_full_access"
ON challenges
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. FIX NOTIFICATIONS TABLE
-- ============================================

-- First, check if notifications table exists with wrong schema
-- If it has 'notification_type' instead of 'type', we need to fix it

-- Create or replace the notifications table with correct schema
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- Add 'type' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'type') THEN
        -- Check if notification_type exists and rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'notification_type') THEN
            ALTER TABLE notifications RENAME COLUMN notification_type TO type;
        ELSE
            ALTER TABLE notifications ADD COLUMN type VARCHAR(50);
        END IF;
    END IF;

    -- Add 'message' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'message') THEN
        ALTER TABLE notifications ADD COLUMN message TEXT DEFAULT '';
    END IF;

    -- Add 'is_read' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- Add 'data' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}';
    END IF;
END
$$;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on notifications
DROP POLICY IF EXISTS "Allow all operations for anon users" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Server can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create permissive policy for server-side API access
CREATE POLICY "notifications_full_access"
ON notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 3. FIX OTHER TABLES THAT MIGHT HAVE RLS ISSUES
-- ============================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_full_access" ON users;
CREATE POLICY "users_full_access" ON users FOR ALL USING (true) WITH CHECK (true);

-- Portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portfolios_full_access" ON portfolios;
CREATE POLICY "portfolios_full_access" ON portfolios FOR ALL USING (true) WITH CHECK (true);

-- User credentials table
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_credentials_full_access" ON user_credentials;
CREATE POLICY "user_credentials_full_access" ON user_credentials FOR ALL USING (true) WITH CHECK (true);

-- Followers table
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "followers_full_access" ON followers;
CREATE POLICY "followers_full_access" ON followers FOR ALL USING (true) WITH CHECK (true);

-- Badges table
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badges_full_access" ON badges;
CREATE POLICY "badges_full_access" ON badges FOR ALL USING (true) WITH CHECK (true);

-- Portfolio likes table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portfolio_likes') THEN
        ALTER TABLE portfolio_likes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "portfolio_likes_full_access" ON portfolio_likes;
        CREATE POLICY "portfolio_likes_full_access" ON portfolio_likes FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- User streaks table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
        ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "user_streaks_full_access" ON user_streaks;
        CREATE POLICY "user_streaks_full_access" ON user_streaks FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Daily rewards table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_rewards') THEN
        ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "daily_rewards_full_access" ON daily_rewards;
        CREATE POLICY "daily_rewards_full_access" ON daily_rewards FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- User statistics table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_statistics') THEN
        ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "user_statistics_full_access" ON user_statistics;
        CREATE POLICY "user_statistics_full_access" ON user_statistics FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- User preferences table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "user_preferences_full_access" ON user_preferences;
        CREATE POLICY "user_preferences_full_access" ON user_preferences FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Referrals table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') THEN
        ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "referrals_full_access" ON referrals;
        CREATE POLICY "referrals_full_access" ON referrals FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Price alerts table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'price_alerts') THEN
        ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "price_alerts_full_access" ON price_alerts;
        CREATE POLICY "price_alerts_full_access" ON price_alerts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- ============================================
-- 4. VERIFY ALL POLICIES
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
