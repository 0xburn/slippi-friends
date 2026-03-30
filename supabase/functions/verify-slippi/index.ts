import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLIPPI_GQL_ENDPOINT = 'https://internal.slippi.gg/graphql';

const SLIPPI_QUERY = `
fragment profileFields on NetplayProfile {
  ratingOrdinal
  ratingUpdateCount
  wins
  losses
  dailyGlobalPlacement
  continent
  characters { character gameCount __typename }
  __typename
}
query VerifyLookup($cc: String, $uid: String) {
  getUser(connectCode: $cc, fbUid: $uid) {
    fbUid
    displayName
    connectCode { code __typename }
    status
    rankedNetplayProfile { ...profileFields __typename }
    rankedNetplayProfileHistory {
      ...profileFields
      season { id name status __typename }
      __typename
    }
    __typename
  }
}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { slippiUid, connectCode } = await req.json();

    const slippiRes = await fetch(SLIPPI_GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'VerifyLookup',
        variables: { cc: connectCode, uid: slippiUid },
        query: SLIPPI_QUERY,
      }),
    });

    const data = await slippiRes.json();
    const user = data?.data?.getUser;

    if (!user || user.fbUid !== slippiUid) {
      return new Response(
        JSON.stringify({ verified: false, error: 'UID does not match connect code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    const { data: { user: authUser } } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );

    if (!authUser) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: banRecord } = await supabase
      .from('blacklist')
      .select('id')
      .eq('user_id', authUser.id)
      .limit(1)
      .maybeSingle();

    if (banRecord) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: 'This account has been suspended. Contact lucky7smelee@gmail.com to appeal.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First-come-first-claimed: reject if another verified user owns this code
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, verified')
      .eq('connect_code', connectCode)
      .neq('id', authUser.id)
      .maybeSingle();

    if (existing?.verified) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: 'This connect code is already claimed by another account. If this is your code, email lucky7smelee@gmail.com to recover your profile.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('profiles').upsert({
      id: authUser.id,
      slippi_uid: slippiUid,
      connect_code: connectCode,
      display_name: user.displayName,
      verified: true,
      verified_at: new Date().toISOString(),
    });

    if (user.rankedNetplayProfile) {
      const r = user.rankedNetplayProfile;
      await supabase.from('slippi_cache').upsert({
        connect_code: connectCode,
        display_name: user.displayName,
        slippi_uid: user.fbUid,
        rating_ordinal: r.ratingOrdinal,
        wins: r.wins,
        losses: r.losses,
        global_placement: r.dailyGlobalPlacement,
        continent: r.continent,
        characters: r.characters?.map((c: any) => ({ character: c.character, gameCount: c.gameCount })) ?? [],
        fetched_at: new Date().toISOString(),
      });
    }

    // Populate player_ratings with current + historical elo
    {
      const ranked = user.rankedNetplayProfile;
      const currentRating = ranked?.ratingOrdinal ?? null;
      const currentWins = ranked?.wins ?? 0;
      const currentLosses = ranked?.losses ?? 0;

      const history: any[] = user.rankedNetplayProfileHistory ?? [];
      const peakPastRating = history
        .filter((p: any) => p.season?.status !== 'active' && p.ratingOrdinal != null)
        .reduce((max: number | null, p: any) =>
          max == null || p.ratingOrdinal > max ? p.ratingOrdinal : max, null);

      let effectiveRating: number | null;
      if (currentWins + currentLosses > 0) {
        effectiveRating = currentRating;
      } else if (peakPastRating != null) {
        effectiveRating = peakPastRating;
      } else {
        effectiveRating = null;
      }

      const seasons = history.map((p: any) => ({
        ratingOrdinal: p.ratingOrdinal,
        wins: p.wins,
        losses: p.losses,
        seasonId: p.season?.id ?? null,
        seasonName: p.season?.name ?? null,
        seasonStatus: p.season?.status ?? null,
      }));

      await supabase.from('player_ratings').upsert({
        connect_code: connectCode,
        current_rating: currentRating,
        current_wins: currentWins,
        current_losses: currentLosses,
        peak_past_rating: peakPastRating,
        effective_rating: effectiveRating,
        seasons,
        fetched_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ verified: true, profile: user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ verified: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
