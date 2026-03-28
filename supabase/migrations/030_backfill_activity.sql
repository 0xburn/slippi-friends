-- One-time backfill of user_activity from the matches table.
-- Groups consecutive matches into sessions (gap > 15 min = new session).
-- Session duration = (last match - first match) + 300s for the final game.
-- Only counts matches with an opponent_connect_code.

WITH ordered AS (
  SELECT
    user_id,
    played_at,
    LAG(played_at) OVER (PARTITION BY user_id ORDER BY played_at) AS prev_played_at
  FROM matches
  WHERE opponent_connect_code IS NOT NULL
    AND played_at >= '2026-03-24T00:00:00Z'
),
boundaries AS (
  SELECT
    user_id,
    played_at,
    CASE
      WHEN prev_played_at IS NULL THEN 1
      WHEN EXTRACT(EPOCH FROM (played_at - prev_played_at)) > 900 THEN 1
      ELSE 0
    END AS new_session
  FROM ordered
),
session_groups AS (
  SELECT
    user_id,
    played_at,
    SUM(new_session) OVER (PARTITION BY user_id ORDER BY played_at) AS session_id
  FROM boundaries
),
session_durations AS (
  SELECT
    user_id,
    GREATEST(
      EXTRACT(EPOCH FROM (MAX(played_at) - MIN(played_at)))::BIGINT + 300,
      300
    ) AS duration_seconds
  FROM session_groups
  GROUP BY user_id, session_id
),
user_totals AS (
  SELECT
    user_id,
    SUM(duration_seconds)::BIGINT AS total_seconds
  FROM session_durations
  GROUP BY user_id
)
INSERT INTO user_activity (user_id, in_game_seconds, online_seconds, updated_at)
SELECT user_id, total_seconds, 0, NOW()
FROM user_totals
ON CONFLICT (user_id) DO UPDATE SET
  in_game_seconds = EXCLUDED.in_game_seconds,
  updated_at = NOW();
