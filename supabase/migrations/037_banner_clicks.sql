CREATE TABLE IF NOT EXISTS banner_clicks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banner     text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_banner_clicks_banner ON banner_clicks (banner);

ALTER TABLE banner_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY banner_clicks_insert ON banner_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
