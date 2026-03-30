CREATE TABLE player_ratings (
  connect_code    TEXT PRIMARY KEY,
  current_rating  NUMERIC,
  current_wins    INTEGER DEFAULT 0,
  current_losses  INTEGER DEFAULT 0,
  peak_past_rating NUMERIC,
  effective_rating NUMERIC,
  seasons         JSONB DEFAULT '[]',
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_ratings_effective ON player_ratings (effective_rating);

ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ratings_read   ON player_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY ratings_write  ON player_ratings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ratings_update ON player_ratings FOR UPDATE TO authenticated USING (true);
