-- ============================================
-- SEASON, SQUAD, TRANSFER, SNAPSHOT SCHEMA
-- Run once in Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================

-- ----------------------------------------------------------------
-- 1. SEASON STATE — singleton row with global season clock
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS season_state (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    season_number INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    total_weeks INTEGER NOT NULL DEFAULT 52,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial season anchored to the most recent Monday.
INSERT INTO season_state (id, season_number, start_date)
VALUES (1, 1, (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 6) % 7))::DATE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- 2. PORTFOLIO SNAPSHOTS — Fri 16:00 ET captures for #7 privacy gate
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    gameweek INTEGER NOT NULL,
    season_number INTEGER NOT NULL DEFAULT 1,
    players JSONB NOT NULL,
    formation VARCHAR(20) NOT NULL,
    UNIQUE(portfolio_id, gameweek, season_number)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_portfolio_week
    ON portfolio_snapshots(portfolio_id, gameweek DESC);

-- ----------------------------------------------------------------
-- 3. WEEKEND SWAPS — track Sat/Sun substitutions + enforce 4/weekend cap
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekend_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,
    season_number INTEGER NOT NULL DEFAULT 1,
    starter_symbol VARCHAR(20) NOT NULL,
    bench_symbol VARCHAR(20) NOT NULL,
    xp_cost INTEGER NOT NULL DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swaps_user_week
    ON weekend_swaps(user_id, season_number, gameweek);

-- ----------------------------------------------------------------
-- 4. TRANSFER LOG — quarterly signings + enforce 5/quarter cap
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    season_number INTEGER NOT NULL DEFAULT 1,
    out_symbol VARCHAR(20) NOT NULL,
    in_symbol VARCHAR(20) NOT NULL,
    allocation_strategy VARCHAR(20) NOT NULL CHECK (allocation_strategy IN ('inherit', 'split')),
    xp_cost INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_user_quarter
    ON transfer_log(user_id, season_number, quarter);

-- ----------------------------------------------------------------
-- 5. CHALLENGES — add opponent_symbol for arbitrary-ETF challenges (#5)
-- ----------------------------------------------------------------
ALTER TABLE challenges
    ADD COLUMN IF NOT EXISTS opponent_symbol VARCHAR(20);

-- ----------------------------------------------------------------
-- Row Level Security (matches existing permissive pattern — server
-- API routes validate ownership using the userId in the request)
-- ----------------------------------------------------------------
ALTER TABLE season_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekend_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "season_state_read" ON season_state;
CREATE POLICY "season_state_read" ON season_state
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "portfolio_snapshots_full" ON portfolio_snapshots;
CREATE POLICY "portfolio_snapshots_full" ON portfolio_snapshots
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "weekend_swaps_full" ON weekend_swaps;
CREATE POLICY "weekend_swaps_full" ON weekend_swaps
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "transfer_log_full" ON transfer_log;
CREATE POLICY "transfer_log_full" ON transfer_log
    FOR ALL USING (true) WITH CHECK (true);
