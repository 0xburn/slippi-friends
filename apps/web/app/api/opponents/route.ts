import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ matches: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const opponent_connect_code = typeof body.opponent_connect_code === 'string' ? body.opponent_connect_code : '';
  if (!opponent_connect_code) {
    return NextResponse.json({ error: 'opponent_connect_code required' }, { status: 400 });
  }

  const row = {
    user_id: user.id,
    opponent_connect_code,
    opponent_display_name:
      typeof body.opponent_display_name === 'string' ? body.opponent_display_name : null,
    opponent_slippi_uid:
      typeof body.opponent_slippi_uid === 'string' ? body.opponent_slippi_uid : null,
    user_character_id: typeof body.user_character_id === 'number' ? body.user_character_id : null,
    opponent_character_id:
      typeof body.opponent_character_id === 'number' ? body.opponent_character_id : null,
    stage_id: typeof body.stage_id === 'number' ? body.stage_id : null,
    game_mode: typeof body.game_mode === 'string' ? body.game_mode : null,
    did_win: typeof body.did_win === 'boolean' ? body.did_win : null,
    replay_filename: typeof body.replay_filename === 'string' ? body.replay_filename : null,
    played_at:
      typeof body.played_at === 'string' ? body.played_at : new Date().toISOString(),
  };

  const { data, error } = await supabase.from('matches').insert(row).select('id').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
