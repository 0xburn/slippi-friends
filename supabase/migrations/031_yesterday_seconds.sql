-- Add yesterday_seconds column for rank change tracking.
-- A daily cron (or app-side job) copies in_game_seconds -> yesterday_seconds.

ALTER TABLE user_activity ADD COLUMN yesterday_seconds BIGINT NOT NULL DEFAULT 0;

-- Backfill: set yesterday to current value minus one day's worth of estimated play.
-- Since we don't have historical daily data, seed it to current value so everyone
-- starts at +0 today. Tomorrow's cron will set real values.
UPDATE user_activity SET yesterday_seconds = in_game_seconds;
