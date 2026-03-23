import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function normalizeConnectCode(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (t.includes('#')) return t;
  const i = t.lastIndexOf('-');
  if (i <= 0) return t;
  return `${t.slice(0, i)}#${t.slice(i + 1)}`;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from('friends')
    .select(
      `
      id,
      created_at,
      friend:profiles!friends_friend_id_fkey (
        id,
        connect_code,
        display_name,
        verified
      )
    `
    )
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const codes =
    rows
      ?.map((r) => {
        const row = r as unknown as { friend: { connect_code: string | null } | null };
        return row.friend?.connect_code;
      })
      .filter((c): c is string => !!c) ?? [];

  let cacheByCode: Record<string, Record<string, unknown>> = {};
  if (codes.length > 0) {
    const { data: cacheRows } = await supabase
      .from('slippi_cache')
      .select('*')
      .in('connect_code', codes);
    cacheByCode = Object.fromEntries((cacheRows ?? []).map((c) => [c.connect_code as string, c]));
  }

  return NextResponse.json({
    friends: (rows ?? []).map((r) => {
      const row = r as unknown as {
        id: string;
        created_at: string;
        friend: { id: string; connect_code: string | null; display_name: string | null } | null;
      };
      const code = row.friend?.connect_code;
      return {
        friendshipId: row.id,
        createdAt: row.created_at,
        friend: row.friend,
        slippi: code ? cacheByCode[code] ?? null : null,
      };
    }),
  });
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

  let body: { connectCode?: string };
  try {
    body = (await request.json()) as { connectCode?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const connectCode = typeof body.connectCode === 'string' ? normalizeConnectCode(body.connectCode) : '';
  if (!connectCode) {
    return NextResponse.json({ error: 'connectCode required' }, { status: 400 });
  }

  const { data: target, error: tErr } = await supabase
    .from('profiles')
    .select('id, connect_code')
    .eq('connect_code', connectCode)
    .maybeSingle();

  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
  }

  const { data: inserted, error: insErr } = await supabase
    .from('friends')
    .insert({ user_id: user.id, friend_id: target.id })
    .select('id')
    .single();

  if (insErr) {
    if (insErr.code === '23505') {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ friendshipId: inserted.id }, { status: 201 });
}
