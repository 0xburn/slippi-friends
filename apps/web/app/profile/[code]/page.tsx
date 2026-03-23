import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CharacterIcon } from '@/components/CharacterIcon';
import { RankBadge } from '@/components/RankBadge';
import { AddFriendIsland, ProfilePresenceIsland } from '@/components/ProfileWidgets';
import { getCharacterName } from '@/lib/characters';
import { parseConnectCodeParam } from '@/lib/connect-code';

type SlippiCharacterRow = { character: number; gameCount: number };

export default async function ProfilePage({ params }: { params: { code: string } }) {
  const connectCode = parseConnectCodeParam(params.code);
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, connect_code, display_name, verified, twitter_handle, twitch_handle, discord_username, show_online_status, show_social_links'
    )
    .eq('connect_code', connectCode)
    .maybeSingle();

  if (!profile?.connect_code) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slippi-border bg-slippi-card px-8 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Player not found</h1>
        <p className="mt-3 text-gray-400">
          No profile is registered for connect code{' '}
          <span className="font-mono text-[#21BA45]">{connectCode}</span>.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-[#21BA45] hover:underline"
        >
          Back home
        </Link>
      </div>
    );
  }

  const { data: cache } = await supabase
    .from('slippi_cache')
    .select('*')
    .eq('connect_code', connectCode)
    .maybeSingle();

  const { data: viewer } = await supabase.auth.getUser();
  const viewerId = viewer.user?.id ?? null;

  let alreadyFriends = false;
  if (viewerId && viewerId !== profile.id) {
    const { data: row } = await supabase
      .from('friends')
      .select('id')
      .eq('user_id', viewerId)
      .eq('friend_id', profile.id)
      .maybeSingle();
    alreadyFriends = !!row;
  }

  const displayName = profile.display_name ?? cache?.display_name ?? 'Slippi player';
  const rating = cache?.rating_ordinal != null ? Number(cache.rating_ordinal) : null;
  const wins = cache?.wins ?? 0;
  const losses = cache?.losses ?? 0;
  const placement = cache?.global_placement;
  const rawChars = (cache?.characters as SlippiCharacterRow[] | null) ?? [];
  const sortedChars = [...rawChars].sort((a, b) => b.gameCount - a.gameCount);

  const showSocial = profile.show_social_links !== false;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slippi-border bg-slippi-card bg-noise p-6 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">{displayName}</h1>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-wide text-[#21BA45] sm:text-3xl">
              {profile.connect_code}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <RankBadge rating={rating} />
              {rating != null && (
                <span className="text-sm text-gray-400">
                  Rating{' '}
                  <span className="font-mono text-white">{rating.toFixed(2)}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-slippi-border bg-black/30 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
              <div className="mt-1">
                <ProfilePresenceIsland
                  profileUserId={profile.id}
                  showOnlineStatus={profile.show_online_status !== false}
                />
              </div>
            </div>
            <AddFriendIsland
              connectCode={profile.connect_code}
              canAdd={!!viewerId}
              alreadyFriends={alreadyFriends}
              isSelf={viewerId === profile.id}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slippi-border bg-black/25 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Record
            </h2>
            <p className="mt-3 font-mono text-2xl text-white">
              <span className="text-[#21BA45]">{wins}</span>
              <span className="text-gray-600"> / </span>
              <span className="text-red-400">{losses}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">Wins / losses (ranked)</p>
          </div>
          <div className="rounded-xl border border-slippi-border bg-black/25 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Global placement
            </h2>
            <p className="mt-3 font-mono text-2xl text-white">
              {placement != null ? `#${placement.toLocaleString()}` : '—'}
            </p>
            <p className="mt-1 text-sm text-gray-500">Daily snapshot when cached</p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-white">Character mains</h2>
          {sortedChars.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No character data cached yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {sortedChars.map((c) => (
                <li
                  key={c.character}
                  className="flex items-center justify-between rounded-lg border border-slippi-border bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CharacterIcon characterId={c.character} size="md" showName />
                    <span className="text-sm text-gray-400">{getCharacterName(c.character)}</span>
                  </div>
                  <span className="font-mono text-sm text-gray-300">
                    {c.gameCount.toLocaleString()} games
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showSocial && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold text-white">Social</h2>
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {profile.discord_username && (
                <li className="rounded-lg border border-[#5865F2]/40 bg-[#5865F2]/10 px-4 py-2 text-[#aab3ff]">
                  Discord: {profile.discord_username}
                </li>
              )}
              {profile.twitter_handle && (
                <li>
                  <a
                    href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, '')}`}
                    className="inline-block rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sky-300 hover:border-sky-400/50"
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{profile.twitter_handle.replace(/^@/, '')}
                  </a>
                </li>
              )}
              {profile.twitch_handle && (
                <li>
                  <a
                    href={`https://twitch.tv/${profile.twitch_handle}`}
                    className="inline-block rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-purple-300 hover:border-purple-400/50"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Twitch / {profile.twitch_handle}
                  </a>
                </li>
              )}
              {!profile.discord_username && !profile.twitter_handle && !profile.twitch_handle && (
                <li className="text-gray-500">No public links yet.</li>
              )}
            </ul>
          </div>
        )}

        {!profile.verified && (
          <p className="mt-8 text-center text-sm text-amber-500/90">
            Slippi verification pending — stats may be incomplete.{' '}
            <Link href="/claim" className="underline hover:text-amber-400">
              Claim your profile
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
