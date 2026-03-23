import { useEffect, useRef, useState } from 'react';
import { OpponentRow } from '../components/OpponentRow';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL = 30_000;

interface Match {
  id: string;
  opponent_connect_code: string;
  opponent_display_name?: string;
  opponent_character_id?: number | null;
  user_character_id?: number | null;
  played_at: string;
  stage_id?: number | null;
}

export function Opponents() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [friendMap, setFriendMap] = useState<Map<string, 'pending' | 'accepted'>>(new Map());
  const [adding, setAdding] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadedWeeks = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    initialLoad();
    loadFriendCodes();

    const unsub = window.api.onNewOpponent((opp) => {
      setMatches((prev) => [opp, ...prev]);
    });

    pollRef.current = setInterval(() => {
      refreshFromDb();
      loadFriendCodes();
    }, POLL_INTERVAL);

    return () => {
      unsub();
      clearInterval(pollRef.current);
    };
  }, []);

  async function loadFriendCodes() {
    try {
      const friends = await window.api.getFriends();
      const map = new Map<string, 'pending' | 'accepted'>();
      friends.forEach((f: any) => {
        if (f.connectCode) map.set(f.connectCode, f.friendStatus || 'pending');
      });
      setFriendMap(map);
    } catch { /* ignore */ }
  }

  async function refreshFromDb() {
    const data = await window.api.getOpponents(200);
    setMatches(data);
  }

  async function initialLoad() {
    const data = await window.api.getOpponents(200);
    setMatches(data);
    if (data.length === 0) {
      setScanning(true);
      await window.api.backfillOpponents(ONE_WEEK, 0);
      loadedWeeks.current = 1;
      const refreshed = await window.api.getOpponents(200);
      setMatches(refreshed);
      setScanning(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    const beforeMs = loadedWeeks.current * ONE_WEEK;
    const result = await window.api.backfillOpponents(ONE_WEEK, beforeMs);
    loadedWeeks.current += 1;
    if (result.processed === 0) setHasMore(false);
    const refreshed = await window.api.getOpponents(200);
    setMatches(refreshed);
    setLoadingMore(false);
  }

  async function handleAddFriend(code: string) {
    setAdding(code);
    const result = await window.api.addFriend(code);
    if (result.ok) {
      setFriendMap((prev) => new Map(prev).set(code, result.mutual ? 'accepted' : 'pending'));
    }
    setAdding(null);
  }

  function friendState(code: string): 'none' | 'adding' | 'pending' | 'friends' {
    if (adding === code) return 'adding';
    const status = friendMap.get(code);
    if (status === 'accepted') return 'friends';
    if (status === 'pending') return 'pending';
    return 'none';
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Recent Opponents</h1>
        <span className="text-sm text-gray-500">{matches.length} games</span>
      </div>

      <div className="space-y-2">
        {scanning && matches.length === 0 && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-12 text-center">
            <p className="text-[#21BA45] text-sm animate-pulse">
              Scanning last week's replays...
            </p>
          </div>
        )}
        {!scanning && matches.length === 0 && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-12 text-center space-y-4">
            <p className="text-gray-500 text-sm">
              No opponents from the past week.
            </p>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg bg-[#21BA45] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ea33e] transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Scanning...' : 'Load Older Replays'}
              </button>
            )}
            <p className="text-gray-600 text-xs">
              New opponents appear automatically as you play.
            </p>
          </div>
        )}
        {matches.map((m) => {
          const state = friendState(m.opponent_connect_code);
          return (
            <OpponentRow
              key={m.id || m.played_at}
              opponent={m}
              onAddFriend={state === 'none' ? handleAddFriend : undefined}
              friendState={state}
            />
          );
        })}
        {matches.length > 0 && hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-sm text-gray-400 transition-colors hover:text-white hover:border-[#21BA45]/30 disabled:opacity-50"
          >
            {loadingMore ? 'Scanning older replays...' : 'Load More'}
          </button>
        )}
        {!hasMore && matches.length > 0 && (
          <p className="text-center text-xs text-gray-600 py-2">No older replays found</p>
        )}
      </div>
    </div>
  );
}
