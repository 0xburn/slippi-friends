import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { Friends } from './pages/Friends';
import { Opponents } from './pages/Opponents';
import { Settings } from './pages/Settings';

type BootState =
  | { phase: 'loading' }
  | { phase: 'no-slippi' }
  | { phase: 'need-auth'; connectCode: string; displayName: string }
  | { phase: 'need-setup'; connectCode: string }
  | { phase: 'ready' };

function SlippiNotFound() {
  const [checking, setChecking] = useState(false);

  async function retry() {
    setChecking(true);
    const id = await window.api.getIdentity();
    if (id) window.location.reload();
    setChecking(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-8">
        <div className="fixed top-0 left-0 right-0 h-[52px] drag" />
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src="./logo.png" alt="L7" className="w-16 h-16" />
            <h1 className="text-3xl font-display font-bold">
              Slippi <span className="text-[#21BA45]">Friends</span>
            </h1>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-left">
            <p className="text-sm text-yellow-200/90 font-medium mb-2">
              Slippi Launcher not detected
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Open <strong className="text-white">Slippi Launcher</strong> and log in
              to your Slippi account. Slippi Friends needs your connect code to identify you.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Don't have Slippi Launcher?{' '}
              <button
                onClick={() => window.api.openExternal('https://slippi.gg')}
                className="text-[#21BA45] hover:underline"
              >
                Download from slippi.gg
              </button>
            </p>
          </div>
          <button
            onClick={retry}
            disabled={checking}
            className="w-full rounded-xl bg-[#21BA45] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1ea33e] disabled:opacity-60"
          >
            {checking ? 'Checking...' : 'I\'ve Logged In — Retry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthPrompt({ connectCode, displayName }: { connectCode: string; displayName: string }) {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const unsub = window.api.onAuthChanged((user) => {
      if (user) window.location.reload();
    });
    return unsub;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-8">
        <div className="fixed top-0 left-0 right-0 h-[52px] drag" />
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src="./logo.png" alt="L7" className="w-16 h-16" />
            <h1 className="text-3xl font-display font-bold">
              Slippi <span className="text-[#21BA45]">Friends</span>
            </h1>
          </div>
          <div className="rounded-xl border border-[#21BA45]/30 bg-[#21BA45]/5 p-5">
            <p className="text-2xl font-mono font-bold text-white tracking-wider">
              {connectCode}
            </p>
            {displayName && <p className="text-sm text-gray-400 mt-1">{displayName}</p>}
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Link your Discord account to sync friends, track opponents,
            and show your online status. You only need to do this once.
          </p>
          <button
            onClick={() => { setWaiting(true); window.api.startAuth(); }}
            disabled={waiting}
            className="w-full rounded-xl bg-[#5865F2] px-6 py-3.5 font-semibold text-white transition-all hover:bg-[#4752C4] disabled:opacity-70"
          >
            {waiting ? 'Waiting for Discord...' : 'Link Discord Account'}
          </button>
          {waiting && (
            <p className="text-xs text-gray-500 animate-pulse">
              Complete sign-in in your browser, then return here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [state, setState] = useState<BootState>({ phase: 'loading' });

  useEffect(() => {
    boot();
  }, []);

  async function boot() {
    const identity = await window.api.getIdentity();
    if (!identity) {
      setState({ phase: 'no-slippi' });
      return;
    }

    const authed = await window.api.isAuthenticated();
    if (!authed) {
      setState({ phase: 'need-auth', connectCode: identity.connectCode, displayName: identity.displayName });
      return;
    }

    const setupDone = await window.api.isSetupComplete();
    if (!setupDone) {
      setState({ phase: 'need-setup', connectCode: identity.connectCode });
      return;
    }

    setState({ phase: 'ready' });
  }

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed top-0 left-0 right-0 h-[52px] drag" />
        <img src="./logo.png" alt="L7" className="w-20 h-20 animate-pulse" />
      </div>
    );
  }

  if (state.phase === 'no-slippi') return <SlippiNotFound />;

  if (state.phase === 'need-auth') {
    return <AuthPrompt connectCode={state.connectCode} displayName={state.displayName} />;
  }

  if (state.phase === 'need-setup') {
    return (
      <HashRouter>
        <Routes>
          <Route path="*" element={
            <Setup onComplete={() => setState({ phase: 'ready' })} />
          } />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Navigation />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/opponents" element={<Opponents />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
