ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Backfill from auth.users metadata
UPDATE profiles SET avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u WHERE profiles.id = u.id AND profiles.avatar_url IS NULL;

-- Update trigger to also capture avatar_url on new sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, discord_username, discord_id, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'provider_id',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
