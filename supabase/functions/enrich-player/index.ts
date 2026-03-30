import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLIPPI_GQL_ENDPOINT = 'https://internal.slippi.gg/graphql';

const SLIPPI_QUERY = `
fragment profileFields on NetplayProfile {
  ratingOrdinal ratingUpdateCount wins losses dailyGlobalPlacement continent
  characters { character gameCount __typename }
  __typename
}
query EnrichLookup($cc: String, $uid: String) {
  getUser(connectCode: $cc, fbUid: $uid) {
    fbUid displayName connectCode { code __typename } status
    rankedNetplayProfile { ...profileFields __typename }
    rankedNetplayProfileHistory {
      ...profileFields
      season { id name status __typename }
      __typename
    }
    __typename
  }
}`;

const CACHE_TTL_MS = 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { connectCode } = await req.json();
    if (!connectCode) {
      return new Response(
        JSON.stringify({ error: 'connectCode required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // DEPRECATED: slippi_cache — use player_ratings instead
    const { data: cached } = await supabase
      .from('slippi_cache')
      .select('*')
      .eq('connect_code', connectCode)
      .single();

    if (cached?.fetched_at) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({ source: 'cache', player: cached }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const slippiRes = await fetch(SLIPPI_GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'EnrichLookup',
        variables: { cc: connectCode, uid: connectCode },
        query: SLIPPI_QUERY,
      }),
    });

    const data = await slippiRes.json();
    const user = data?.data?.getUser;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Player not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const r = user.rankedNetplayProfile;
    const record = {
      connect_code: user.connectCode?.code ?? connectCode,
      display_name: user.displayName,
      slippi_uid: user.fbUid,
      rating_ordinal: r?.ratingOrdinal ?? null,
      wins: r?.wins ?? 0,
      losses: r?.losses ?? 0,
      global_placement: r?.dailyGlobalPlacement ?? null,
      continent: r?.continent ?? null,
      characters: r?.characters?.map((c: any) => ({ character: c.character, gameCount: c.gameCount })) ?? [],
      subscription_level: user.activeSubscription?.level ?? null,
      fetched_at: new Date().toISOString(),
    };

    // DEPRECATED: slippi_cache — use player_ratings instead
    await supabase.from('slippi_cache').upsert(record);

    return new Response(
      JSON.stringify({ source: 'api', player: record }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
