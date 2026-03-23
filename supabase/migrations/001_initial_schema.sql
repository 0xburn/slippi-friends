CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slippi_uid TEXT UNIQUE,
  connect_code TEXT UNIQUE,
  display_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  discord_username TEXT,
  discord_id TEXT,
  twitter_handle TEXT,
  twitch_handle TEXT,
  custom_url TEXT,
  lucky_stats_id TEXT,
  lucky_stats_verified BOOLEAN DEFAULT FALSE,
  lucky_stats_elo NUMERIC,
  show_online_status BOOLEAN DEFAULT TRUE,
  show_social_links BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, discord_username, discord_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_connect_code TEXT NOT NULL,
  opponent_display_name TEXT,
  opponent_slippi_uid TEXT,
  user_character_id INTEGER,
  opponent_character_id INTEGER,
  stage_id INTEGER,
  game_mode TEXT,
  did_win BOOLEAN,
  replay_filename TEXT,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_user ON matches(user_id);
CREATE INDEX idx_matches_opponent ON matches(opponent_connect_code);
CREATE INDEX idx_matches_played ON matches(played_at DESC);

CREATE TABLE slippi_cache (
  connect_code TEXT PRIMARY KEY,
  display_name TEXT,
  slippi_uid TEXT,
  rating_ordinal NUMERIC,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  global_placement INTEGER,
  continent TEXT,
  characters JSONB DEFAULT '[]',
  subscription_level TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slippi_cache_fetched ON slippi_cache(fetched_at);

CREATE TABLE presence_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  current_character INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_presence_log_user ON presence_log(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE slippi_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "friends_own_read" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "friends_own_insert" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friends_own_delete" ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "matches_own_read" ON matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "matches_own_insert" ON matches FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cache_public_read" ON slippi_cache FOR SELECT USING (true);

CREATE POLICY "presence_public_read" ON presence_log FOR SELECT USING (true);
CREATE POLICY "presence_own_write" ON presence_log FOR ALL USING (auth.uid() = user_id);
