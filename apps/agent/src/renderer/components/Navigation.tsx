import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AF, IS_APRIL_FOOLS } from '../lib/aprilFools';

const baseLinks = [
  { to: '/', label: 'Friends', icon: '♟' },
  { to: '/discover', label: 'Discover', icon: '◎' },
  { to: '/ggs', label: 'GGs', icon: '✦' },
  { to: '/opponents', label: 'Opponents', icon: '⚔' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '▲' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

const ADMIN_CODES = ['SMOK#1', 'BF#0', 'BURN#0', 'BURN#1'];

export function Navigation() {
  const [copied, setCopied] = useState(false);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [livePresence, setLivePresence] = useState<{ online: number; inGame: number } | null>(null);
  const [nudgesDisabled, setNudgesDisabled] = useState(false);
  const [unreadNudges, setUnreadNudges] = useState(0);

  useEffect(() => {
    window.api.getPlayerCount().then((c: number) => { if (c > 0) setPlayerCount(c); });
    window.api.getBroadcast().then((msg: string | null) => setBroadcast(msg));
    window.api.getLivePresence().then(setLivePresence);
    window.api.getSettings().then((s: any) => { setNudgesDisabled(!!s.disableNudges); });
    window.api.getUnreadNudgeCount().then(setUnreadNudges);
    window.api.getIdentity().then((id: any) => {
      if (id?.connectCode && ADMIN_CODES.includes(id.connectCode)) {
        setIsAdmin(true);
      }
    });
    const unsubNudges = window.api.onUnreadNudgeCount(setUnreadNudges);
    function refreshStats() {
      window.api.getPlayerCount().then((c: number) => { if (c > 0) setPlayerCount(c); });
      window.api.getLivePresence().then(setLivePresence);
      window.api.getBroadcast().then((msg: string | null) => setBroadcast(msg));
      window.api.getUnreadNudgeCount().then(setUnreadNudges);
    }
    const interval = setInterval(refreshStats, 300_000);
    const onVisible = () => { if (!document.hidden) refreshStats(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { unsubNudges(); clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  async function handleShare() {
    try {
      await window.api.copyToClipboard(AF.shareBlurb);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-[#2a2a2a] bg-[#0d0d0d]">
        {/* Spacer for macOS traffic lights */}
        <div className="h-[52px] shrink-0 drag" />
        {IS_APRIL_FOOLS ? (
          <div className="flex justify-center px-3 pb-3 no-drag">
            <img src={AF.logo} alt="Grinder" className="w-[120px] object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-5 pb-4 no-drag">
            <img src={AF.logo} alt="L7" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-base tracking-tight text-white">
              {AF.appName}
            </span>
          </div>
        )}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {baseLinks.filter((link) => !(link.to === '/ggs' && nudgesDisabled)).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? IS_APRIL_FOOLS
                      ? 'bg-[#F5A623]/10 text-[#F5A623]'
                      : 'bg-[#21BA45]/10 text-[#21BA45]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
              {link.to === '/ggs' && unreadNudges > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ backgroundColor: AF.primary }}>
                  {unreadNudges > 99 ? '99+' : unreadNudges}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pb-2">
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: `${AF.primary}b3`, }}
            onMouseEnter={(e) => { e.currentTarget.style.color = AF.primary; e.currentTarget.style.backgroundColor = `${AF.primary}1a`; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = `${AF.primary}b3`; e.currentTarget.style.backgroundColor = ''; }}
          >
            <span className="text-sm">🔗</span>
            {copied ? 'Copied!' : 'Share with a Friend!'}
          </button>
        </div>
        <div className="px-5 py-2 text-[10px] text-gray-600">v1.0.10</div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="h-[52px] shrink-0 drag relative">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 no-drag">
            {livePresence && (
              <>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-[10px] text-gray-500">{livePresence.online} online</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  <span className="text-[10px] text-gray-500">{livePresence.inGame} in-game</span>
                </div>
              </>
            )}
            {playerCount != null && (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: AF.primary }} />
                <span className="text-[10px] text-gray-500">{playerCount} {AF.playerCountLabel}</span>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          {IS_APRIL_FOOLS ? (
            <div className="mb-4 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/5 px-5 py-4">
              <p className="text-sm font-semibold text-[#F5A623] mb-2">⚠️ Important Notice</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                We received a <strong className="text-white">Cease &amp; Desist</strong> due to the name of our app, <em>friendlies</em>.
              </p>
              <p className="text-xs text-gray-300 leading-relaxed mt-1.5">
                As such, we have renamed the app to <strong className="text-[#F5A623]">Grinder</strong>. This better represents the types of activities people are using the app for: grinding Melee!
              </p>
            </div>
          ) : (
            <button
              onClick={() => window.api.openExternal('https://start.gg/fullhouse')}
              className="mb-4 w-full rounded-xl overflow-hidden border border-[#2a5a2a]/40 bg-gradient-to-r from-[#0d1f0d] via-[#122212] to-[#0d1f0d] hover:border-[#3a7a3a]/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4 px-5 py-2.5">
                <img src="./siege.png" alt="Full House: Siege" className="h-10 w-10 object-contain shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold tracking-wide text-[#d4c48a]">FULL HOUSE: SIEGE</span>
                  <span className="text-[11px] text-gray-400">featuring Zain, Hungrybox, Cody Schwab, Jmook, Wizzrobe, Soonsay, RapMonster, and more!</span>
                  <span className="text-xs font-semibold text-[#21BA45]">April 24 – 26, 2026</span>
                </div>
              </div>
            </button>
          )}
          {broadcast && !broadcastDismissed && (
            <div className="mb-4 rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: `${AF.primary}33`, backgroundColor: `${AF.primary}0d` }}>
              <span className="text-sm">📢</span>
              <p className="flex-1 text-sm whitespace-pre-line" style={{ color: `${AF.primary}e6` }}>{broadcast}</p>
              <button
                onClick={() => setBroadcastDismissed(true)}
                className="shrink-0 text-lg leading-none transition-colors"
                style={{ color: `${AF.primary}66` }}
                onMouseEnter={(e) => { e.currentTarget.style.color = AF.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = `${AF.primary}66`; }}
              >
                ×
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
