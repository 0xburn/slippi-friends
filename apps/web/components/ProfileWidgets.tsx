'use client';

import { useState } from 'react';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { usePresence } from '@/components/PresenceProvider';

export function ProfilePresenceIsland({
  profileUserId,
  showOnlineStatus,
}: {
  profileUserId: string;
  showOnlineStatus: boolean;
}) {
  const { getPresence, loading } = usePresence();
  if (!showOnlineStatus) {
    return (
      <span className="text-sm text-gray-500">This player hides online status.</span>
    );
  }
  const p = getPresence(profileUserId);
  const status = p?.status ?? 'offline';

  return (
    <div className="flex items-center gap-2">
      {loading && !p ? (
        <span className="text-sm text-gray-500">Checking…</span>
      ) : (
        <>
          <OnlineIndicator status={status} />
          <span className="text-sm capitalize text-gray-300">{status.replace('-', ' ')}</span>
        </>
      )}
    </div>
  );
}

export function AddFriendIsland({
  connectCode,
  canAdd,
  alreadyFriends,
  isSelf,
}: {
  connectCode: string;
  canAdd: boolean;
  alreadyFriends: boolean;
  isSelf: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(alreadyFriends);
  const [err, setErr] = useState<string | null>(null);

  if (isSelf) {
    return (
      <p className="text-sm text-gray-500">This is your profile.</p>
    );
  }

  if (!canAdd) {
    return (
      <a
        href="/"
        className="inline-flex rounded-lg bg-[#21BA45] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#1da63d]"
      >
        Sign in to add friends
      </a>
    );
  }

  if (done) {
    return (
      <span className="text-sm font-medium text-[#21BA45]">Already friends</span>
    );
  }

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectCode }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409) {
        setDone(true);
        return;
      }
      if (!res.ok) {
        setErr(data.error ?? 'Could not add friend');
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void add()}
        className="inline-flex rounded-lg bg-[#21BA45] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#1da63d] disabled:opacity-50"
      >
        {busy ? 'Adding…' : 'Add Friend'}
      </button>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  );
}
