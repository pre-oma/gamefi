-- ============================================
-- TRAINING / LESSON COMPLETIONS SCHEMA
-- Run this in Supabase SQL Editor once.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================

-- One row per (user, lesson) — UNIQUE constraint prevents double-awarding XP.
CREATE TABLE IF NOT EXISTS lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    xp_awarded INTEGER NOT NULL DEFAULT 100,
    UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id
    ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_module
    ON lesson_completions(user_id, module_id);

-- Row Level Security: matches the existing pattern in this project where
-- server-side API routes validate ownership using the userId supplied in
-- the request, so the table is opened up via a permissive policy.
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_completions_full_access" ON lesson_completions;
CREATE POLICY "lesson_completions_full_access"
    ON lesson_completions
    FOR ALL
    USING (true)
    WITH CHECK (true);
