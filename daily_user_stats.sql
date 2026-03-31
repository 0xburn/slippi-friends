-- Daily feature usage: unique users and event counts per day (EST)
SELECT
  (created_at AT TIME ZONE 'America/New_York')::date                AS day,
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
  COUNT(DISTINCT user_id)                                                     AS total_active_users
FROM event_log
GROUP BY (created_at AT TIME ZONE 'America/New_York')::date
ORDER BY day DESC;

-- DAU from presence (all users who had the app open, not just feature users)
SELECT
  (updated_at AT TIME ZONE 'America/New_York')::date AS day,
  COUNT(DISTINCT user_id) AS dau
FROM presence_log
WHERE updated_at >= now() - interval '7 days'
GROUP BY (updated_at AT TIME ZONE 'America/New_York')::date
ORDER BY day DESC;
