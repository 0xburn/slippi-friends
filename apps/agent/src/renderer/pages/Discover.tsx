import { useEffect, useRef, useState } from 'react';
import { PlayerCard } from '../components/PlayerCard';
import { CharacterIcon } from '../components/CharacterIcon';
import { ConnectionTypeIcon } from '../components/ConnectionTypeIcon';
import { CHARACTER_MAP, getCharacterImagePath, getCharacterShortName } from '../lib/characters';

interface DiscoverPlayer {
  userId: string;
  connectCode: string;
  displayName?: string;
  discordUsername?: string | null;
  discordId?: string | null;
  avatarUrl?: string;
  rating: number | null;
  topCharacters: { characterId: number; gameCount: number }[];
  region: string | null;
  status: 'online' | 'in-game';
  currentCharacter: number | null;
  opponentCode: string | null;
  playingSince: string | null;
  connectionType: 'wifi' | 'ethernet' | null;
  lastPlayedAt: string | null;
  lookingToPlay?: boolean;
  statusPreset?: string | null;
}

function formatLastPlayed(iso: string): string {
  const played = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - played.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'You played this person today!';
  if (diffDays === 1) return 'You played this person yesterday!';
  return `You played this person ${diffDays} days ago!`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-3 flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-[#1a1a1a]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-24 rounded bg-[#1a1a1a]" />
        <div className="h-2.5 w-16 rounded bg-[#1a1a1a]" />
      </div>
      <div className="h-3 w-10 rounded bg-[#1a1a1a]" />
    </div>
  );
}

const HIDDEN_CHARACTERS = new Set([23]);
const ALL_CHARACTER_IDS = Object.keys(CHARACTER_MAP).map(Number)
  .filter((id) => !HIDDEN_CHARACTERS.has(id))
  .sort((a, b) => CHARACTER_MAP[a].localeCompare(CHARACTER_MAP[b]));

const TOP_CHARACTERS = [2, 20, 9, 19, 15, 12, 0];
const TOP_SET = new Set(TOP_CHARACTERS);
const REST_CHARACTERS = ALL_CHARACTER_IDS.filter((id) => !TOP_SET.has(id));

function CharacterFilter({ selected, onToggle, onClear }: {
  selected: Set<number>;
  onToggle: (id: number) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasRestSelected = REST_CHARACTERS.some((id) => selected.has(id));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Filter by character</span>
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear ({selected.size})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TOP_CHARACTERS.map((id) => {
          const active = selected.has(id);
          const imgPath = getCharacterImagePath(id);
          const name = getCharacterShortName(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              title={CHARACTER_MAP[id]}
              className={`
                relative h-10 w-10 rounded-lg border transition-all flex items-center justify-center
                ${active
                  ? 'border-[#21BA45]/60 bg-[#21BA45]/15 ring-1 ring-[#21BA45]/30'
                  : 'border-[#2a2a2a] bg-[#141414] opacity-60 hover:opacity-90 hover:border-[#3a3a3a]'
                }
              `}
            >
              {imgPath ? (
                <img src={imgPath} alt={name} className="h-8 object-contain" loading="lazy" />
              ) : (
                <span className="text-xs font-bold text-gray-400">{name.slice(0, 2)}</span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            relative h-10 px-3 rounded-lg border transition-all flex items-center justify-center
            ${expanded || hasRestSelected
              ? 'border-[#3a3a3a] bg-[#1a1a1a] text-gray-300'
              : 'border-[#2a2a2a] bg-[#141414] text-gray-500 opacity-60 hover:opacity-90 hover:border-[#3a3a3a]'
            }
          `}
        >
          <span className="text-xs font-medium">{expanded ? 'Less' : 'More'}</span>
        </button>
      </div>
      {expanded && (
        <div className="flex flex-wrap gap-1.5">
          {REST_CHARACTERS.map((id) => {
            const active = selected.has(id);
            const imgPath = getCharacterImagePath(id);
            const name = getCharacterShortName(id);
            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                title={CHARACTER_MAP[id]}
                className={`
                  relative h-10 w-10 rounded-lg border transition-all flex items-center justify-center
                  ${active
                    ? 'border-[#21BA45]/60 bg-[#21BA45]/15 ring-1 ring-[#21BA45]/30'
                    : 'border-[#2a2a2a] bg-[#141414] opacity-60 hover:opacity-90 hover:border-[#3a3a3a]'
                  }
                `}
              >
                {imgPath ? (
                  <img src={imgPath} alt={name} className="h-8 object-contain" loading="lazy" />
                ) : (
                  <span className="text-xs font-bold text-gray-400">{name.slice(0, 2)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Discover() {
  const [players, setPlayers] = useState<DiscoverPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedMap, setAddedMap] = useState<Map<string, 'pending' | 'friends'>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [visibleCount, setVisibleCount] = useState(15);
  const [confirmBlock, setConfirmBlock] = useState<string | null>(null);
  const [addNoteModal, setAddNoteModal] = useState<string | null>(null);
  const [addNote, setAddNote] = useState<string | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState<Record<string, string | true>>({});
  const [sentInvites, setSentInvites] = useState<{ id: string; connectCode: string; displayName?: string; status: string; mainCharacter?: number | null; connectionType?: 'wifi' | 'ethernet' | null; region?: string | null }[]>([]);
  const [charFilter, setCharFilter] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const charFilterRef = useRef(charFilter);
  charFilterRef.current = charFilter;

  async function load(chars?: Set<number>) {
    const filter = chars ?? charFilterRef.current;
    try {
      const ids = filter.size > 0 ? Array.from(filter) : undefined;
      const data = await window.api.discoverPlayers(ids);
      setPlayers(data || []);
    } catch {}
    setLoading(false);
    setLastRefresh(Date.now());
    setVisibleCount(15);
  }

  async function loadSentInvites() {
    try {
      const data = await window.api.getSentInvites();
      setSentInvites((data || []).filter((d: any) => !d.sender_opened).slice(0, 10).map((d: any) => ({
        id: d.id,
        connectCode: d.connectCode || '',
        displayName: d.displayName,
        status: d.status || 'pending',
        mainCharacter: d.mainCharacter ?? null,
        connectionType: d.connectionType ?? null,
        region: d.region ?? null,
      })));
    } catch {}
  }

  async function handleCancelSentInvite(inviteId: string) {
    await window.api.dismissInvite(inviteId);
    await loadSentInvites();
  }

  useEffect(() => {
    load();
    loadSentInvites();
    window.api.getIdentity().then((id) => { if (id) setMyCode(id.connectCode); });
    const interval = setInterval(() => { if (!document.hidden) { load(); loadSentInvites(); } }, 30_000);
    const onVisible = () => { if (!document.hidden) { load(); loadSentInvites(); } };
    document.addEventListener('visibilitychange', onVisible);
    const unsubInvRefresh = window.api.onInvitesRefresh(() => { loadSentInvites(); });
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); unsubInvRefresh(); };
  }, []);

  function handleAddClick(connectCode: string) {
    setAddNote(null);
    setAddNoteModal(connectCode);
  }

  async function handleAddConfirm() {
    const code = addNoteModal;
    if (!code) return;
    setAddNoteModal(null);
    setAdding(code);
    const result = await window.api.addFriend(code, addNote ?? undefined);
    if (result.ok || result.mutual) {
      setAddedMap((prev) => new Map(prev).set(code, result.mutual ? 'friends' : 'pending'));
    }
    setAddNote(null);
    setAdding(null);
  }

  async function handleInvite(connectCode: string) {
    setInviting(connectCode);
    const result = await window.api.sendPlayInvite(connectCode);
    if (result.error) {
      setInviteSent((prev) => ({ ...prev, [connectCode]: result.error }));
    } else {
      setInviteSent((prev) => ({ ...prev, [connectCode]: true }));
      await loadSentInvites();
    }
    setInviting(null);
  }

  async function handleCopy(code: string) {
    await window.api.copyToClipboard(code);
  }

  async function handleBlock(connectCode: string) {
    setConfirmBlock(null);
    await window.api.blockUser(connectCode);
    setPlayers((prev) => prev.filter((p) => p.connectCode !== connectCode));
  }

  function toggleChar(id: number) {
    setCharFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setLoading(true);
      load(next);
      return next;
    });
  }

  function clearFilter() {
    setCharFilter(new Set());
    setLoading(true);
    load(new Set());
  }

  const ago = Math.round((Date.now() - lastRefresh) / 1000);
  const refreshLabel = ago < 5 ? 'just now' : `${ago}s ago`;

  const filtered = search
    ? players.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.connectCode?.toLowerCase().includes(q) ||
          p.displayName?.toLowerCase().includes(q) ||
          p.discordUsername?.toLowerCase().includes(q)
        );
      })
    : players;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Discover</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Players online now, sorted by proximity
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#222] transition-all"
        >
          Refresh
        </button>
      </div>

      <CharacterFilter
        selected={charFilter}
        onToggle={toggleChar}
        onClear={clearFilter}
      />

      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setVisibleCount(15); }}
        placeholder="Search by code, name, or Discord..."
        className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#21BA45]/50"
      />

      {sentInvites.length > 0 && (
        <div className="space-y-2">
          {sentInvites.map((inv) => (
            <div key={`sent-${inv.id}`} className={`rounded-2xl border p-4 ${
              inv.status === 'accepted'
                ? 'border-[#21BA45]/30 bg-[#21BA45]/5'
                : 'border-blue-500/20 bg-blue-500/5'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {inv.mainCharacter != null && (
                    <CharacterIcon characterId={inv.mainCharacter} size="sm" />
                  )}
                  <span className="font-mono font-bold text-white text-sm">{inv.connectCode}</span>
                  {inv.displayName && (
                    <span className="text-xs text-gray-500 truncate">{inv.displayName}</span>
                  )}
                  {inv.connectionType && <ConnectionTypeIcon type={inv.connectionType} />}
                  {inv.region && <span className="text-[10px] text-gray-500">{inv.region}</span>}
                </div>
                {inv.status === 'accepted' ? (
                  <span className="text-sm font-semibold text-[#21BA45]">Accepted!</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-blue-400">Waiting for {inv.connectCode} to accept...</span>
                    <button
                      onClick={() => handleCancelSentInvite(inv.id)}
                      className="shrink-0 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {loading && players.length === 0 && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && filtered.length === 0 && !search && charFilter.size === 0 && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-12 text-center">
            <p className="text-gray-500 text-sm">
              No players online right now. Check back later!
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && (search || charFilter.size > 0) && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-12 text-center">
            <p className="text-gray-500 text-sm">
              {search ? 'No players match your search.' : 'No players match the selected characters.'}
            </p>
          </div>
        )}

        {filtered.slice(0, visibleCount).map((p) => {
          const state = adding === p.connectCode ? 'adding' : (addedMap.get(p.connectCode) ?? null);
          return (
            <div key={p.userId} className="space-y-1">
              {p.lastPlayedAt && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-amber-400 text-xs">⚑</span>
                  <span className="text-[11px] font-medium text-amber-400/90">
                    {formatLastPlayed(p.lastPlayedAt)}
                  </span>
                </div>
              )}
              <PlayerCard
                player={{
                  connectCode: p.connectCode,
                  displayName: p.displayName,
                  discordUsername: p.discordUsername ?? undefined,
                  discordId: p.discordId,
                  avatarUrl: p.avatarUrl,
                  rating: p.rating,
                  topCharacters: p.topCharacters,
                  region: p.region,
                  status: p.status,
                  currentCharacter: p.currentCharacter,
                  opponentCode: p.opponentCode,
                  playingSince: p.playingSince,
                  connectionType: p.connectionType ?? undefined,
                  lookingToPlay: p.lookingToPlay,
                  statusPreset: p.statusPreset,
                }}
                onClick={() => handleCopy(p.connectCode)}
                onBlock={() => setConfirmBlock(p.connectCode)}
                onAdd={!state ? () => handleAddClick(p.connectCode) : undefined}
                addState={state}
                onInvite={() => handleInvite(p.connectCode)}
                inviteDisabled={inviting === p.connectCode || !!inviteSent[p.connectCode]}
                inviteState={inviteSent[p.connectCode] ?? null}
              />
            </div>
          );
        })}

        {filtered.length > visibleCount && visibleCount < 100 && (
          <button
            onClick={() => setVisibleCount((c) => Math.min(c + 15, 100))}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#141414] py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            Load more
          </button>
        )}
        {filtered.length > 0 && (visibleCount >= filtered.length || visibleCount >= 100) && (
          <p className="text-center text-xs text-gray-600 py-3">
            Surely someone in this list is good enough for you!
          </p>
        )}
      </div>

      {addNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddNoteModal(null)}>
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6 w-[360px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-white font-semibold text-center">
              Add <span className="font-mono text-[#21BA45]">{addNoteModal}</span>
            </p>
            <p className="text-xs text-gray-400 text-center mt-2 leading-relaxed">
            When adding a player, it often helps to let them know a bit more info on what you're looking for! Notes are optional.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['Looking for MU practice', 'GGs from unranked', 'Same region', 'Just saying hi', 'Similar skill level'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setAddNote(addNote === tag ? null : tag)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    addNote === tag
                      ? 'bg-[#21BA45]/20 text-[#21BA45] border border-[#21BA45]/40'
                      : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setAddNote(null); setAddNoteModal(null); }}
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAddConfirm}
                className="flex-1 rounded-lg bg-[#21BA45] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ea33e] transition-colors"
              >
                {addNote ? 'Send with note' : 'Send without note'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmBlock(null)}>
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6 w-[320px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-300 text-center">
              Block <span className="font-mono font-bold text-white">{confirmBlock}</span>?
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              They won't appear on your Discover page and can't send you requests or invites.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmBlock(null)}
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlock(confirmBlock)}
                className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
