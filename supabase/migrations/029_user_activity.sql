-- Tracks cumulative online/in-game time for the leaderboard.
-- Incremented by the presence heartbeat (~150s ticks) via the RPC below.

CREATE TABLE user_activity (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  online_seconds  BIGINT NOT NULL DEFAULT 0,
  in_game_seconds BIGINT NOT NULL DEFAULT 0,
  total_seconds   BIGINT GENERATED ALWAYS AS (online_seconds + in_game_seconds) STORED,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_total ON user_activity(total_seconds DESC);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_activity_public_read"
  ON user_activity FOR SELECT USING (true);

CREATE POLICY "user_activity_own_write"
  ON user_activity FOR ALL USING (auth.uid() = user_id);

-- Atomic upsert: adds delta seconds to the correct bucket.
-- Capped server-side at 300s to guard against stale/replayed calls.
CREATE OR REPLACE FUNCTION increment_activity(
  p_user_id  UUID,
  p_seconds  INTEGER,
  p_in_game  BOOLEAN
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_seconds INTEGER := LEAST(p_seconds, 300);
BEGIN
  INSERT INTO user_activity (user_id, online_seconds, in_game_seconds, updated_at)
  VALUES (
    p_user_id,
    CASE WHEN NOT p_in_game THEN safe_seconds ELSE 0 END,
    CASE WHEN p_in_game THEN safe_seconds ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    online_seconds  = user_activity.online_seconds
                      + CASE WHEN NOT p_in_game THEN safe_seconds ELSE 0 END,
    in_game_seconds = user_activity.in_game_seconds
                      + CASE WHEN p_in_game THEN safe_seconds ELSE 0 END,
    updated_at = NOW();
END;
$$;
