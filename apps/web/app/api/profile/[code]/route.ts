import { createClient } from '@/lib/supabase/server';
import { parseConnectCodeParam } from '@/lib/connect-code';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const connectCode = parseConnectCodeParam(params.code);
  const supabase = createClient();

  const [{ data: profile, error: pErr }, { data: slippi, error: sErr }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, connect_code, display_name, verified, twitter_handle, twitch_handle, discord_username, show_online_status, show_social_links, created_at'
      )
      .eq('connect_code', connectCode)
      .maybeSingle(),
    supabase.from('slippi_cache').select('*').eq('connect_code', connectCode).maybeSingle(),
  ]);

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ profile, slippi });
}
