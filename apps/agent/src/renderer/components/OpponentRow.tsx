import { useState } from 'react';
import { CharacterIcon } from './CharacterIcon';
import { PlayerStatsPanel } from './PlayerStatsPanel';

interface OpponentRowProps {
  opponent: {
    opponent_connect_code: string;
    opponent_display_name?: string;
    opponent_character_id?: number | null;
    user_character_id?: number | null;
    played_at: string;
  };
  onAddFriend?: (code: string) => void;
  friendState: 'none' | 'adding' | 'pending' | 'friends';
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function OpponentRow({ opponent, onAddFriend, friendState }: OpponentRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] transition-all hover:border-[#2a2a2a]/80">
      <div
        className="flex items-center gap-4 p-3 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {opponent.opponent_character_id != null && <CharacterIcon characterId={opponent.opponent_character_id} />}
        <div className="flex-1 min-w-0">
          <span className="font-mono font-bold text-white text-sm">{opponent.opponent_connect_code}</span>
          {opponent.opponent_display_name && <p className="text-xs text-gray-500 truncate">{opponent.opponent_display_name}</p>}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(opponent.played_at)}</span>
        {friendState === 'friends' ? (
          <span className="shrink-0 rounded-lg border border-[#21BA45]/20 bg-[#21BA45]/5 px-3 py-1 text-xs font-medium text-[#21BA45]/60">
            Friends
          </span>
        ) : friendState === 'pending' ? (
          <span className="shrink-0 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-1 text-xs font-medium text-yellow-500/70">
            Pending
          </span>
        ) : friendState === 'adding' ? (
          <span className="shrink-0 rounded-lg border border-[#2a2a2a] px-3 py-1 text-xs text-gray-500 animate-pulse">
            Adding...
          </span>
        ) : onAddFriend ? (
          <button onClick={(e) => { e.stopPropagation(); onAddFriend(opponent.opponent_connect_code); }}
            className="shrink-0 rounded-lg border border-[#21BA45]/30 bg-[#21BA45]/10 px-3 py-1 text-xs font-medium text-[#21BA45] hover:bg-[#21BA45]/20 transition-colors">
            Add Friend
          </button>
        ) : null}
        <svg className={`w-4 h-4 text-gray-600 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && <PlayerStatsPanel connectCode={opponent.opponent_connect_code} />}
    </div>
  );
}
