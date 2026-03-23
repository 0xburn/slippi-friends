import { useState } from 'react';
import { OnlineIndicator } from './OnlineIndicator';
import { RankBadge } from './RankBadge';
import { CharacterIcon } from './CharacterIcon';
import { PlayerStatsPanel } from './PlayerStatsPanel';

interface PlayerCardProps {
  player: {
    connectCode: string;
    displayName?: string;
    discordUsername?: string;
    avatarUrl?: string;
    rating?: number | null;
    characterId?: number | null;
    status?: 'online' | 'in-game' | 'offline';
  };
  showStatus?: boolean;
  expandable?: boolean;
  onClick?: () => void;
}

export function PlayerCard({ player, showStatus = true, expandable = true, onClick }: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasAvatar = !!player.avatarUrl;

  function handleClick() {
    if (expandable) {
      setExpanded((prev) => !prev);
    }
    onClick?.();
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] transition-all hover:border-[#21BA45]/30 hover:shadow-[0_0_30px_rgba(33,186,69,0.1)]">
      <div onClick={handleClick}
        className="group flex items-center gap-4 p-4 cursor-pointer">
        {hasAvatar ? (
          <img
            src={player.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#2a2a2a]"
          />
        ) : player.characterId != null ? (
          <CharacterIcon characterId={player.characterId} size="lg" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
            {player.connectCode.slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white tracking-wide">{player.connectCode}</span>
            {showStatus && player.status && <OnlineIndicator status={player.status} size="sm" />}
          </div>
          {(player.displayName || player.discordUsername) && (
            <p className="text-sm text-gray-400 truncate">
              {player.displayName}
              {player.discordUsername && player.displayName !== player.discordUsername && (
                <span className="text-gray-600 ml-1.5">@{player.discordUsername}</span>
              )}
              {!player.displayName && player.discordUsername && (
                <span>@{player.discordUsername}</span>
              )}
            </p>
          )}
        </div>
        <RankBadge rating={player.rating ?? null} />
        {expandable && (
          <svg className={`w-4 h-4 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      {expanded && <PlayerStatsPanel connectCode={player.connectCode} />}
    </div>
  );
}
