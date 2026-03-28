import { useEffect, useState } from 'react';
import { CharacterIcon } from '../components/CharacterIcon';

interface LeaderboardEntry {
  userId: string;
  connectCode: string;
  displayName: string;
  avatarUrl: string | null;
  mainCharacter: number | null;
  inGameSeconds: number;
  todaySeconds: number;
}

function formatHours(seconds: number): string {
  const h = seconds / 3600;
  if (h < 1) {
    const m = Math.round(seconds / 60);
    return `${m}m`;
  }
  if (h < 10) return `${h.toFixed(1)}h`;
  return `${Math.round(h)}h`;
}

function formatHoursLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-6 h-4 rounded bg-[#1a1a1a]" />
      <div className="w-8 h-8 rounded-full bg-[#1a1a1a]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-[#1a1a1a]" />
        <div className="h-2.5 w-16 rounded bg-[#1a1a1a]" />
      </div>
      <div className="h-4 w-12 rounded bg-[#1a1a1a]" />
    </div>
  );
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCode, setMyCode] = useState<string | null>(null);

  useEffect(() => {
    window.api.getIdentity().then((id: any) => {
      if (id?.connectCode) setMyCode(id.connectCode);
    });
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await window.api.getLeaderboard(100);
      setEntries(data);
    } catch (e) {
      console.error('leaderboard load', e);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-display font-bold text-white">Leaderboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Hours spent playing Melee on friendlies</p>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2a2a2a] text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          <span className="w-6 text-center">#</span>
          <span className="w-8" />
          <span className="flex-1">Player</span>
          <span className="w-16 text-right">Today</span>
          <span className="w-20 text-right">Total</span>
        </div>

        {loading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
        ) : entries.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No activity yet. Play some Melee to climb the leaderboard!
          </div>
        ) : (
          entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = myCode === entry.connectCode;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isMe
                    ? 'bg-[#21BA45]/5 border-l-2 border-[#21BA45]'
                    : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                } ${i > 0 ? 'border-t border-[#1a1a1a]' : ''}`}
              >
                <span className={`w-6 text-center text-xs font-bold ${
                  rank === 1 ? 'text-yellow-400' :
                  rank === 2 ? 'text-gray-300' :
                  rank === 3 ? 'text-amber-600' :
                  'text-gray-600'
                }`}>
                  {rank}
                </span>

                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] shrink-0 flex items-center justify-center overflow-hidden">
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : entry.mainCharacter != null ? (
                    <CharacterIcon characterId={entry.mainCharacter} size="sm" />
                  ) : (
                    <span className="text-xs text-gray-600">?</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate ${isMe ? 'text-[#21BA45]' : 'text-white'}`}>
                      {entry.displayName || entry.connectCode}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-bold text-[#21BA45]/60 uppercase">you</span>
                    )}
                  </div>
                  {entry.displayName && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      {entry.connectCode}
                    </span>
                  )}
                </div>

                <span className="w-16 text-right text-xs font-mono tabular-nums text-[#21BA45]/80">
                  {entry.todaySeconds > 0 ? `+${formatHours(entry.todaySeconds)}` : '--'}
                </span>

                <span className="w-20 text-right text-sm font-semibold text-white font-mono tabular-nums"
                  title={formatHoursLong(entry.inGameSeconds)}>
                  {formatHours(entry.inGameSeconds)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Tracks time playing against an opponent with the app open.
      </p>
    </div>
  );
}
