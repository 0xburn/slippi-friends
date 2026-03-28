-- Add yesterday_seconds for rank change tracking.

ALTER TABLE user_activity ADD COLUMN yesterday_seconds BIGINT NOT NULL DEFAULT 0;

-- Backfill yesterday_seconds using the same session-based calculation as 030,
-- but only counting matches before today (so it represents end-of-yesterday totals).

WITH ordered AS (
  SELECT
    user_id,
    played_at,
    LAG(played_at) OVER (PARTITION BY user_id ORDER BY played_at) AS prev_played_at
  FROM matches
  WHERE opponent_connect_code IS NOT NULL
    AND played_at >= '2026-03-24T00:00:00Z'
    AND played_at < CURRENT_DATE
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
UPDATE user_activity ua
SET yesterday_seconds = ut.total_seconds
FROM user_totals ut
WHERE ua.user_id = ut.user_id;
