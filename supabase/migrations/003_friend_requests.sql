-- Add status to friends: 'pending' or 'accepted'
ALTER TABLE friends ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Mark any existing friends as accepted (legacy rows)
UPDATE friends SET status = 'accepted' WHERE friend_id IS NOT NULL;

-- Allow the recipient to see incoming friend requests
CREATE POLICY "friends_incoming_read" ON friends FOR SELECT USING (
  friend_connect_code = (SELECT connect_code FROM profiles WHERE id = auth.uid())
);

-- Allow the recipient to update (accept) incoming requests
CREATE POLICY "friends_incoming_update" ON friends FOR UPDATE USING (
  friend_connect_code = (SELECT connect_code FROM profiles WHERE id = auth.uid())
);

-- Allow the recipient to delete (decline) incoming requests
CREATE POLICY "friends_incoming_delete" ON friends FOR DELETE USING (
  friend_connect_code = (SELECT connect_code FROM profiles WHERE id = auth.uid())
);
