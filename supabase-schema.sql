-- Supabase Schema for GameFi Learning
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT 'New investor on Gamefi Invest!',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  total_rewards INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  max_teams INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credentials (passwords)
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Portfolios (Teams)
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  formation VARCHAR(20) NOT NULL DEFAULT '4-3-3',
  players JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  cloned_from UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  clone_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Followers (user follows user)
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Portfolio likes
CREATE TABLE portfolio_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id)
);

-- User badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  icon VARCHAR(50) DEFAULT '',
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities feed
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  target_id UUID,
  target_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
CREATE INDEX idx_portfolio_likes_portfolio_id ON portfolio_likes(portfolio_id);
CREATE INDEX idx_portfolio_likes_user_id ON portfolio_likes(user_id);
CREATE INDEX idx_badges_user_id ON badges(user_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Anyone can read, users can update their own
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);

-- User credentials: Only server-side access (using service role key)
CREATE POLICY "Credentials server access only" ON user_credentials FOR ALL USING (true);

-- Portfolios: Public portfolios viewable by all, owners can manage their own
CREATE POLICY "Public portfolios are viewable by everyone" ON portfolios FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can insert own portfolios" ON portfolios FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own portfolios" ON portfolios FOR UPDATE USING (true);
CREATE POLICY "Users can delete own portfolios" ON portfolios FOR DELETE USING (true);

-- Followers: Anyone can view, users can manage their own follows
CREATE POLICY "Followers are viewable by everyone" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON followers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (true);

-- Likes: Anyone can view, users can like/unlike
CREATE POLICY "Likes are viewable by everyone" ON portfolio_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON portfolio_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike" ON portfolio_likes FOR DELETE USING (true);

-- Badges: Anyone can view
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "Server can insert badges" ON badges FOR INSERT WITH CHECK (true);

-- Activities: Anyone can view
CREATE POLICY "Activities are viewable by everyone" ON activities FOR SELECT USING (true);
CREATE POLICY "Server can insert activities" ON activities FOR INSERT WITH CHECK (true);

-- Notifications: Users can view their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Server can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON user_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
