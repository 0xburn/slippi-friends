-- Count accepted mutual friends between the caller and each discover candidate.
-- Client RLS cannot read other users' friends rows; this runs with definer rights.

CREATE OR REPLACE FUNCTION public.discover_mutual_friend_counts(p_candidate_ids uuid[])
RETURNS TABLE (candidate_id uuid, mutual_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.user_id, COUNT(*)::integer
  FROM friends tr
  INNER JOIN friends mf
    ON mf.user_id = auth.uid()
   AND mf.status = 'accepted'
   AND mf.friend_id IS NOT NULL
   AND mf.friend_id = tr.friend_id
  WHERE tr.user_id = ANY(p_candidate_ids)
    AND tr.status = 'accepted'
    AND tr.friend_id IS NOT NULL
  GROUP BY tr.user_id;
$$;

REVOKE ALL ON FUNCTION public.discover_mutual_friend_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discover_mutual_friend_counts(uuid[]) TO authenticated;
