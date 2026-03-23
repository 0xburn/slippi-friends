CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT,
  discord_username TEXT,
  reason TEXT NOT NULL,
  claimed_code TEXT,
  actual_code TEXT,
  replay_file TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blacklist_user_id_idx ON blacklist (user_id);
CREATE INDEX IF NOT EXISTS blacklist_discord_id_idx ON blacklist (discord_id) WHERE discord_id IS NOT NULL;

-- Only service role and the user's own agent can insert (via authenticated).
-- Nobody can delete/update except service role (manage from dashboard).
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY blacklist_insert ON blacklist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY blacklist_read_own ON blacklist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
