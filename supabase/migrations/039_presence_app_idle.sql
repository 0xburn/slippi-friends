ALTER TABLE presence_log ADD COLUMN IF NOT EXISTS app_idle boolean NOT NULL DEFAULT false;
