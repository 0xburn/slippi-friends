'use client';

import Link from 'next/link';
import { OnlineIndicator } from './OnlineIndicator';
import { RankBadge } from './RankBadge';
import { CharacterIcon } from './CharacterIcon';

interface PlayerCardProps {
  player: {
    connectCode: string;
    displayName?: string;
    rating?: number | null;
    characterId?: number | null;
    status?: 'online' | 'in-game' | 'offline';
  };
  showStatus?: boolean;
}

export function PlayerCard({ player, showStatus = true }: PlayerCardProps) {
  const code = encodeURIComponent(player.connectCode.replace('#', '-'));

  return (
    <Link href={`/profile/${code}`}>
      <div className="group relative flex items-center gap-4 rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 transition-all hover:border-[#21BA45]/30 hover:shadow-[0_0_30px_rgba(33,186,69,0.1)]">
        {player.characterId != null && (
          <CharacterIcon characterId={player.characterId} size="lg" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white tracking-wide">
              {player.connectCode}
            </span>
            {showStatus && player.status && (
              <OnlineIndicator status={player.status} size="sm" />
            )}
          </div>
          {player.displayName && (
            <p className="text-sm text-gray-400 truncate">{player.displayName}</p>
          )}
        </div>
        <RankBadge rating={player.rating ?? null} />
      </div>
    </Link>
  );
}
