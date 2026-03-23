interface OnlineIndicatorProps {
  status: 'online' | 'in-game' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  opponentCode?: string | null;
  playingSince?: string | null;
}

function formatDuration(sinceStr: string): string {
  const ms = Date.now() - new Date(sinceStr).getTime();
  const mins = Math.max(1, Math.floor(ms / 60_000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function OnlineIndicator({ status, size = 'md', opponentCode, playingSince }: OnlineIndicatorProps) {
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  const colors = {
    online: 'bg-[#21BA45] animate-pulse',
    'in-game': 'bg-yellow-400',
    offline: 'bg-gray-500',
  };

  const showOpponent = status === 'in-game' && opponentCode;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block rounded-full ${sizes[size]} ${colors[status]}`}
        title={status}
      />
      {showOpponent && (
        <span className="text-xs text-yellow-400/80 font-mono whitespace-nowrap">
          vs {opponentCode}
          {playingSince && (
            <span className="text-yellow-400/50 ml-1">
              {formatDuration(playingSince)}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
