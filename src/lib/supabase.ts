import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization - client is created on first use, not at build time
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  }

  return null;
}

// Create a chainable mock for when Supabase is not configured
const createChainableMock = () => {
  const mock: any = {
    data: null,
    error: new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'),
  };

  const chainable = () => mock;

  // Add all chainable methods
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'range', 'overlaps', 'textSearch',
    'match', 'not', 'or', 'filter', 'order', 'limit', 'single', 'maybeSingle', 'csv', 'returns'];

  methods.forEach(method => {
    mock[method] = chainable;
  });

  return mock;
};

// Export a proxy that lazily creates the client when first accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      if (prop === 'from') {
        return () => createChainableMock();
      }
      console.error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
      throw new Error('Supabase is not configured');
    }
    return (client as any)[prop];
  },
});

// Database types matching our schema
export interface DbUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  bio: string;
  joined_at: string;
  total_rewards: number;
  level: number;
  xp: number;
  max_teams: number;
  created_at: string;
  updated_at: string;
}

export interface DbUserCredentials {
  id: string;
  user_id: string;
  password_hash: string;
  salt: string;
  created_at: string;
  updated_at: string;
}

export interface DbPortfolio {
  id: string;
  user_id: string;
  name: string;
  description: string;
  formation: string;
  players: string; // JSON string
  is_public: boolean;
  cloned_from: string | null;
  clone_count: number;
  tags: string[]; // PostgreSQL array
  created_at: string;
  updated_at: string;
}

export interface DbFollower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DbPortfolioLike {
  id: string;
  user_id: string;
  portfolio_id: string;
  created_at: string;
}

export interface DbBadge {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface DbChallenge {
  id: string;
  type: 'sp500' | 'user';
  status: 'pending' | 'active' | 'completed' | 'declined' | 'cancelled';
  challenger_id: string;
  challenger_portfolio_id: string;
  opponent_id: string | null;
  opponent_portfolio_id: string | null;
  timeframe: '1W' | '2W' | '1M' | '3M';
  start_date: string | null;
  end_date: string | null;
  challenger_start_value: number | null;
  challenger_end_value: number | null;
  opponent_start_value: number | null;
  opponent_end_value: number | null;
  challenger_return_percent: number | null;
  opponent_return_percent: number | null;
  winner_id: string | null;
  xp_awarded: number | null;
  created_at: string;
  settled_at: string | null;
}
