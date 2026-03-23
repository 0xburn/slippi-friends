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

  const { data: friendRows, error: fErr } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', user.id);

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }

  const friendIds = (friendRows ?? []).map((r) => r.friend_id as string);
  if (friendIds.length === 0) {
    return NextResponse.json({ online: [] });
  }

  const { data: presence, error: pErr } = await supabase
    .from('presence_log')
    .select('user_id, status, current_character, updated_at')
    .in('user_id', friendIds)
    .in('status', ['online', 'in-game']);

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const activeUserIds = (presence ?? []).map((p) => p.user_id as string);
  if (activeUserIds.length === 0) {
    return NextResponse.json({ online: [] });
  }

  const { data: profiles, error: prErr } = await supabase
    .from('profiles')
    .select('id, connect_code, display_name')
    .in('id', activeUserIds);

  if (prErr) {
    return NextResponse.json({ error: prErr.message }, { status: 500 });
  }

  const profileById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const merged = (presence ?? [])
    .map((p) => ({
      userId: p.user_id as string,
      status: p.status as string,
      currentCharacter: p.current_character as number | null,
      updatedAt: p.updated_at as string,
      profile: profileById[p.user_id as string] ?? null,
    }))
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      if (a.status === 'in-game') return -1;
      if (b.status === 'in-game') return 1;
      return 0;
    });

  return NextResponse.json({ online: merged });
}
