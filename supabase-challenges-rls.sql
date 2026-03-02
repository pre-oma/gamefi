-- ============================================
-- CHALLENGES TABLE RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- First, ensure RLS is enabled (it likely already is)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for anon users" ON challenges;
DROP POLICY IF EXISTS "challenges_select_policy" ON challenges;
DROP POLICY IF EXISTS "challenges_insert_policy" ON challenges;
DROP POLICY IF EXISTS "challenges_update_policy" ON challenges;
DROP POLICY IF EXISTS "challenges_delete_policy" ON challenges;

-- Since we're using server-side API routes with the anon key,
-- we need permissive policies. In a production app, you would use
-- service_role key on the server or implement proper JWT auth.

-- Option 1: Simple permissive policy (for development/MVP)
-- This allows all operations through the anon key
CREATE POLICY "Allow all operations for anon users"
ON challenges
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- (Also needed for challenge notifications)
-- ============================================

-- Check if notifications table exists and add policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Enable RLS
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow all operations for anon users" ON notifications;

        -- Create permissive policy
        CREATE POLICY "Allow all operations for anon users"
        ON notifications
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- ============================================
-- ALTERNATIVE: More Restrictive Policies
-- Uncomment these if you implement proper auth
-- ============================================

/*
-- Users can view challenges they're part of
CREATE POLICY "challenges_select_policy"
ON challenges
FOR SELECT
USING (
    auth.uid()::text = challenger_id
    OR auth.uid()::text = opponent_id
    OR status = 'completed'  -- Allow viewing completed challenges
);

-- Users can create challenges where they are the challenger
CREATE POLICY "challenges_insert_policy"
ON challenges
FOR INSERT
WITH CHECK (auth.uid()::text = challenger_id);

-- Users can update challenges they're part of
CREATE POLICY "challenges_update_policy"
ON challenges
FOR UPDATE
USING (
    auth.uid()::text = challenger_id
    OR auth.uid()::text = opponent_id
);
*/

-- ============================================
-- Verify policies are created
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'challenges';
