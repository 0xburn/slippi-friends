import Image from 'next/image';
import { DownloadButtons } from '@/components/DownloadButtons';

const REPO = '0xburn/slippi-friends';

async function getLatestRelease() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=1`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const releases = await res.json();
    const release = releases[0];
    if (!release) return null;

    const assets: { name: string; url: string; size: number }[] =
      (release.assets ?? []).map((a: any) => ({
        name: a.name,
        url: a.browser_download_url,
        size: a.size,
      }));

    return { tag: release.tag_name, assets };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const release = await getLatestRelease();

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-slippi-border bg-gradient-to-b from-[#0f0f0f] to-slippi-darker">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-90" />
      <div className="relative px-4 py-16 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-8 flex justify-center">
            <Image
              src="/logo.jpg"
              alt="Slippi Friends"
              width={120}
              height={120}
              className="rounded-2xl"
              priority
            />
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your Melee{' '}
            <span className="text-gradient-green">Social Network</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Track opponents from your Slippi replays, see when friends are
            queueing, view live ranked stats, and manage your friend list — all
            from one lightweight desktop app.
          </p>

          <div className="mt-10">
            <DownloadButtons release={release} repo={REPO} />
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: '⚔️',
              title: 'Track Opponents',
              body: 'Recent netplay matches surface automatically from your replay folder — revisit sets and add rivals as friends.',
            },
            {
              icon: '🟢',
              title: "See Who's Online",
              body: 'Live presence shows who is in queue or in-game so you can shoot codes without digging through DMs.',
            },
            {
              icon: '📊',
              title: 'Live Ranked Stats',
              body: "Click any player to see their ELO, win rate, mains, and global placement — pulled live from Slippi's API.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slippi-border bg-slippi-card/60 p-6 backdrop-blur-sm transition hover:border-[#21BA45]/25 glow-green-hover"
            >
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h2 className="font-display text-lg font-semibold text-white">
                {f.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        <section className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center font-display text-2xl font-bold text-white">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Download & Install',
                body: 'Grab the app for your platform. No account required to start — just point it at your Slippi replay folder.',
              },
              {
                step: '2',
                title: 'Sign in with Discord',
                body: 'Link your Discord to unlock friend requests, presence, and your public profile.',
              },
              {
                step: '3',
                title: 'Play & Connect',
                body: 'The app auto-scans replays, tracks opponents, and lets you add friends by connect code.',
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#21BA45]/40 font-display text-lg font-bold text-[#21BA45]">
                  {s.step}
                </div>
                <h3 className="mt-4 font-display font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-24 max-w-2xl text-center text-sm text-gray-500">
          <p>
            Open source on{' '}
            <a
              href={`https://github.com/${REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#21BA45] underline underline-offset-2 hover:text-[#17cf97]"
            >
              GitHub
            </a>
            . Not affiliated with Slippi or Nintendo.
          </p>
        </footer>
      </div>
    </div>
  );
}
