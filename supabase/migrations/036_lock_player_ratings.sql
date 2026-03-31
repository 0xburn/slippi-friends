-- Restrict player_ratings writes to the row owner.
-- Previously any authenticated user could INSERT/UPDATE any row.

DROP POLICY IF EXISTS ratings_write  ON player_ratings;
DROP POLICY IF EXISTS ratings_update ON player_ratings;

CREATE POLICY ratings_owner_insert ON player_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    connect_code = (SELECT p.connect_code FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY ratings_owner_update ON player_ratings
  FOR UPDATE TO authenticated
  USING (
    connect_code = (SELECT p.connect_code FROM profiles p WHERE p.id = auth.uid())
  );
