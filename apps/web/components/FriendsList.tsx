'use client';

import Link from 'next/link';
import { PlayerCard } from '@/components/PlayerCard';
import { createClient } from '@/lib/supabase/client';

export type FriendsListFriend = {
  friendshipId: string;
  connectCode: string;
  displayName: string | null;
  rating: number | null;
  characterId: number | null;
  status?: 'online' | 'in-game' | 'offline';
};

export function FriendsList({
  friends,
  onRemoved,
}: {
  friends: FriendsListFriend[];
  onRemoved?: () => void;
}) {
  const supabase = createClient();

  async function removeFriend(friendshipId: string) {
    const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
    if (!error) onRemoved?.();
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-xl border border-slippi-border bg-slippi-card/80 px-6 py-16 text-center">
        <p className="text-gray-400">No friends match your search.</p>
        <p className="mt-2 text-sm text-gray-500">
          Add people from{' '}
          <Link href="/opponents" className="text-[#21BA45] hover:underline">
            recent opponents
          </Link>{' '}
          or their profile page.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {friends.map((f) => (
        <li
          key={f.friendshipId}
          className="flex flex-col gap-2 rounded-xl border border-slippi-border bg-slippi-card sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <PlayerCard
              player={{
                connectCode: f.connectCode,
                displayName: f.displayName ?? undefined,
                rating: f.rating,
                characterId: f.characterId ?? undefined,
                status: f.status,
              }}
            />
          </div>
          <div className="flex shrink-0 justify-end px-4 pb-4 sm:px-4 sm:pb-0">
            <button
              type="button"
              onClick={() => removeFriend(f.friendshipId)}
              className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/50"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
