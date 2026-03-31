-- Combined daily dashboard: playing DAU, presence DAU, and feature usage (EST)
SELECT
  d.day,
  COALESCE(m.playing_dau, 0)       AS playing_dau,
  COALESCE(m.total_games, 0)       AS total_games,
  COALESCE(p.presence_dau, 0)      AS presence_dau,
  COALESCE(e.nudge_users, 0)       AS nudge_users,
  COALESCE(e.nudge_count, 0)       AS nudge_count,
  COALESCE(e.invite_sent_users, 0) AS invite_sent_users,
  COALESCE(e.invite_sent_count, 0) AS invite_sent_count,
  COALESCE(e.invite_accepted_users, 0) AS invite_accepted_users,
  COALESCE(e.invite_accepted_count, 0) AS invite_accepted_count,
  COALESCE(e.opened_melee_users, 0)    AS opened_melee_users,
  COALESCE(e.opened_melee_count, 0)    AS opened_melee_count,
  COALESCE(e.invite_declined_users, 0) AS invite_declined_users,
  COALESCE(e.invite_cancelled_users, 0) AS invite_cancelled_users,
  COALESCE(e.feature_active_users, 0)  AS feature_active_users
FROM (
  SELECT DISTINCT d::date AS day
  FROM generate_series(now() - interval '7 days', now(), interval '1 day') d
) d
LEFT JOIN (
  SELECT
    (played_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(DISTINCT user_id) AS playing_dau,
    COUNT(*) AS total_games
  FROM matches
  GROUP BY 1
) m USING (day)
LEFT JOIN (
  SELECT
    (updated_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(DISTINCT user_id) AS presence_dau
  FROM presence_log
  GROUP BY 1
) p USING (day)
LEFT JOIN (
  SELECT
    (created_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'nudge_sent')           AS nudge_users,
    COUNT(*)                FILTER (WHERE event_type = 'nudge_sent')           AS nudge_count,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'invite_sent')          AS invite_sent_users,
    COUNT(*)                FILTER (WHERE event_type = 'invite_sent')          AS invite_sent_count,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'invite_accepted')      AS invite_accepted_users,
    COUNT(*)                FILTER (WHERE event_type = 'invite_accepted')      AS invite_accepted_count,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type IN ('invite_opened_melee', 'invite_both_opened')) AS opened_melee_users,
    COUNT(*)                FILTER (WHERE event_type IN ('invite_opened_melee', 'invite_both_opened')) AS opened_melee_count,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'invite_declined')      AS invite_declined_users,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'invite_cancelled')     AS invite_cancelled_users,
    COUNT(DISTINCT user_id)                                                     AS feature_active_users
  FROM event_log
  GROUP BY 1
) e USING (day)
ORDER BY d.day DESC;
