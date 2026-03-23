CREATE TABLE play_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_play_invites_receiver ON play_invites(receiver_id, created_at DESC);

ALTER TABLE play_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_sender_write" ON play_invites
  FOR ALL USING (auth.uid() = sender_id);

CREATE POLICY "invite_receiver_read" ON play_invites
  FOR SELECT USING (auth.uid() = receiver_id);

CREATE POLICY "invite_receiver_delete" ON play_invites
  FOR DELETE USING (auth.uid() = receiver_id);
