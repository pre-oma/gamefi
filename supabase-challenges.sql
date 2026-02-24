-- Challenges table for 1v1 portfolio competitions
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('sp500', 'user')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined', 'cancelled')),
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenger_portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  opponent_portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  timeframe VARCHAR(5) NOT NULL CHECK (timeframe IN ('1W', '2W', '1M', '3M')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  challenger_start_value DECIMAL(20, 4),
  challenger_end_value DECIMAL(20, 4),
  opponent_start_value DECIMAL(20, 4),
  opponent_end_value DECIMAL(20, 4),
  challenger_return_percent DECIMAL(10, 4),
  opponent_return_percent DECIMAL(10, 4),
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  xp_awarded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent_id ON challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date);

-- Index for finding challenges that need to be settled
CREATE INDEX IF NOT EXISTS idx_challenges_to_settle
  ON challenges(status, end_date)
  WHERE status = 'active';

-- Row Level Security (RLS) policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own challenges (as challenger or opponent)
CREATE POLICY challenges_select_policy ON challenges
  FOR SELECT
  USING (
    challenger_id = auth.uid() OR
    opponent_id = auth.uid() OR
    (type = 'sp500' AND status IN ('active', 'completed'))
  );

-- Policy: Users can create challenges
CREATE POLICY challenges_insert_policy ON challenges
  FOR INSERT
  WITH CHECK (challenger_id = auth.uid());

-- Policy: Users can update challenges they're part of
CREATE POLICY challenges_update_policy ON challenges
  FOR UPDATE
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

-- Function to get active challenge count for a user
CREATE OR REPLACE FUNCTION get_active_challenges_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM challenges
    WHERE (challenger_id = user_id OR opponent_id = user_id)
      AND status IN ('pending', 'active')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create a new challenge
CREATE OR REPLACE FUNCTION can_create_challenge(user_id UUID, required_xp INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
  user_xp INTEGER;
BEGIN
  -- Get active challenges count
  SELECT get_active_challenges_count(user_id) INTO active_count;

  -- Check limit
  IF active_count >= 3 THEN
    RETURN FALSE;
  END IF;

  -- Get user XP
  SELECT xp INTO user_xp FROM users WHERE id = user_id;

  -- Check XP requirement
  IF user_xp < required_xp THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own notifications
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: System can insert notifications for any user
CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT
  WITH CHECK (true);
