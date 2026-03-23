import Image from 'next/image';
import { DownloadButtons } from '@/components/DownloadButtons';

const REPO = '0xburn/friendlies';

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
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <section className="pt-10 pb-10 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="friendlies"
              width={80}
              height={80}
              className="rounded-2xl"
              priority
            />
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            friendlies
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            friends lists for Melee
            <br className="hidden sm:block" />
            see who&apos;s online, manage your friend list, and find new practice partners!
          </p>

          <div className="mt-8">
            <DownloadButtons release={release} repo={REPO} />
          </div>
        </div>
      </section>

      {/* App screenshot */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden shadow-2xl shadow-black/50">
          <Image
            src="/appexample.png"
            alt="Friendlies app"
            width={1200}
            height={750}
            className="w-full"
            priority
          />
        </div>
      </section>

      {/* Features + setup steps */}
      <section className="mx-auto mt-14 max-w-5xl grid gap-px sm:grid-cols-3 rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="bg-[#111] p-6">
          <h2 className="text-sm font-semibold text-white">Live presence</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Know when friends are online, in queue, or mid-set.
          </p>
          <div className="mt-5 pt-5 border-t border-[#2a2a2a] space-y-3">
            {[
              ['1', 'Install friendlies'],
              ['2', 'Sync with Discord'],
              ['3', 'Play!'],
            ].map(([n, label]) => (
              <div key={n} className="flex items-center gap-3">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full border border-[#21BA45]/30 text-[10px] font-mono text-[#21BA45]">
                  {n}
                </span>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#111] p-6">
          <h2 className="text-sm font-semibold text-white">Match history</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Replays are scanned automatically. Every opponent, every game.
          </p>
        </div>
        <div className="bg-[#111] p-6">
          <h2 className="text-sm font-semibold text-white">Ranked stats</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            ELO, win rate, mains, and placement pulled from Slippi.
          </p>
        </div>
      </section>

      <footer className="mt-14 pb-8 text-center text-xs text-gray-600">
        Open source on{' '}
        <a
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-white transition-colors"
        >
          GitHub
        </a>
        . Not affiliated with Slippi or Nintendo.
      </footer>
    </div>
  );
}
