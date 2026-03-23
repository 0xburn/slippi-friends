'use client';

import Link from 'next/link';
import { CharacterIcon } from '@/components/CharacterIcon';
import { getCharacterShortName, STAGE_MAP } from '@/lib/characters';

export type OpponentMatch = {
  id: string;
  opponent_connect_code: string;
  opponent_display_name: string | null;
  opponent_character_id: number | null;
  user_character_id: number | null;
  stage_id: number | null;
  did_win: boolean | null;
  played_at: string;
};

export function OpponentRow({
  match,
  onAddFriend,
  addDisabled,
  addLabel,
}: {
  match: OpponentMatch;
  onAddFriend: () => void;
  addDisabled?: boolean;
  addLabel?: string;
}) {
  const codeParam = encodeURIComponent(match.opponent_connect_code.replace('#', '-'));
  const stageName =
    match.stage_id != null ? STAGE_MAP[match.stage_id] ?? `Stage ${match.stage_id}` : '—';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slippi-border bg-slippi-card p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {match.opponent_character_id != null && (
          <CharacterIcon characterId={match.opponent_character_id} size="lg" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/profile/${codeParam}`}
              className="font-mono text-lg font-bold text-white hover:text-[#21BA45]"
            >
              {match.opponent_connect_code}
            </Link>
            {match.did_win === true && (
              <span className="rounded bg-[#21BA45]/20 px-2 py-0.5 text-xs font-semibold text-[#21BA45]">
                Win
              </span>
            )}
            {match.did_win === false && (
              <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                Loss
              </span>
            )}
          </div>
          {match.opponent_display_name && (
            <p className="truncate text-sm text-gray-400">{match.opponent_display_name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {new Date(match.played_at).toLocaleString()} · {stageName}
            {match.user_character_id != null && (
              <>
                {' '}
                · You: {getCharacterShortName(match.user_character_id)}
              </>
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={addDisabled}
        onClick={onAddFriend}
        className="shrink-0 rounded-lg bg-[#21BA45] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#1da63d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {addLabel ?? 'Add Friend'}
      </button>
    </div>
  );
}
