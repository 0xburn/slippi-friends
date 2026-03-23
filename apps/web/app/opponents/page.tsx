'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OpponentRow, type OpponentMatch } from '@/components/OpponentRow';
import { DesktopBanner } from '@/components/DesktopBanner';

export default function OpponentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<OpponentMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace('/');
      return;
    }

    const { data, error: qErr } = await supabase
      .from('matches')
      .select(
        'id, opponent_connect_code, opponent_display_name, opponent_character_id, user_character_id, stage_id, did_win, played_at'
      )
      .eq('user_id', userData.user.id)
      .order('played_at', { ascending: false })
      .limit(50);

    if (qErr) {
      setError(qErr.message);
      setMatches([]);
    } else {
      setMatches((data as OpponentMatch[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFriend(connectCode: string, rowId: string) {
    setAddingId(rowId);
    setToast(null);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectCode }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setToast(body.error ?? 'Could not add friend');
        return;
      }
      setToast(`Added ${connectCode}`);
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Loading opponents…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <DesktopBanner />
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Recent opponents</h1>
        <p className="mt-2 text-gray-400">Last 50 netplay sets recorded by your agent.</p>
      </div>

      {toast && (
        <p className="mb-4 rounded-lg border border-[#21BA45]/30 bg-[#21BA45]/10 px-4 py-2 text-sm text-[#21BA45]">
          {toast}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {matches.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-slippi-border bg-slippi-card/50 px-6 py-16 text-center text-gray-400">
          <p>No opponents recorded yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Run the desktop agent with your Slippi replay folder configured.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => (
            <li key={m.id}>
              <OpponentRow
                match={m}
                onAddFriend={() => void addFriend(m.opponent_connect_code, m.id)}
                addDisabled={addingId === m.id}
                addLabel={addingId === m.id ? 'Adding…' : 'Add Friend'}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
