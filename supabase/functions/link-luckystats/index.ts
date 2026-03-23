import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      status: 'not_implemented',
      message: 'Lucky Stats integration is planned for v2. Stay tuned!',
    }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
