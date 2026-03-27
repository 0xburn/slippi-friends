ALTER TABLE presence_log
  ADD COLUMN IF NOT EXISTS connection_type TEXT;
