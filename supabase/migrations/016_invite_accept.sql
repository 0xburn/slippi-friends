-- Add status column to play_invites for accept flow
ALTER TABLE play_invites
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'accepted'));

-- Allow receiver to update status (accept the invite)
CREATE POLICY "invite_receiver_update" ON play_invites
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Allow sender to read their own sent invites
CREATE POLICY "invite_sender_read" ON play_invites
  FOR SELECT USING (auth.uid() = sender_id);
