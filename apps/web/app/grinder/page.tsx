import Image from 'next/image';
import { DownloadButtons } from '@/components/DownloadButtons';

const REPO = '0xburn/friendlies';
const IMG_PREFIX = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';
const YELLOW = '#F5A623';

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

export const metadata = {
  title: 'Grinder™ — Find Melee Players Near You',
  description: 'The #1 app for grinding Melee. Find practice partners, see who\'s online, and connect with local players.',
};

export default async function GrinderPage() {
  const release = await getLatestRelease();

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* C&D Notice */}
      <section className="mx-auto max-w-3xl px-4 pt-6">
        <div className="rounded-xl px-5 py-4" style={{ borderWidth: 1, borderColor: `${YELLOW}4d`, backgroundColor: `${YELLOW}0d` }}>
          <p className="text-sm font-semibold mb-2" style={{ color: YELLOW }}>⚠️ Important Notice</p>
          <p className="text-xs text-gray-300 leading-relaxed">
            We received a <strong className="text-white">Cease &amp; Desist</strong> due to the name of our app, <em>friendlies</em>.
          </p>
          <p className="text-xs text-gray-300 leading-relaxed mt-1.5">
            As such, we have renamed the app to <strong style={{ color: YELLOW }}>Grinder</strong>. This better represents the types of activities people are using the app for: grinding Melee!
          </p>
        </div>
      </section>

      {/* Hero */}
      <section className="pt-8 pb-10 sm:pt-10 sm:pb-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src={`${IMG_PREFIX}/grinder.png`}
              alt="Grinder"
              width={120}
              height={120}
              priority
            />
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: YELLOW }}>
            Grinder<span className="text-lg align-super">™</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 px-4">
            find melee players near you &mdash;{' '}
            grind ranked, find practice partners, and connect with local players!
          </p>

          <div className="mt-8">
            <DownloadButtons release={release} repo={REPO} />
          </div>
        </div>
      </section>

      {/* Fake Armada testimonial */}
      <section className="mx-auto max-w-2xl px-4 pb-10">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={`${IMG_PREFIX}/armada1.jpg`}
              alt="Armada"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <div>
              <p className="font-mono font-bold text-white">ARMD#0</p>
              <p className="text-xs text-gray-500">Armada &middot; Gothenburg, Sweden</p>
            </div>
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap" style={{ borderColor: '#8B008B', color: '#8B008B', backgroundColor: '#8B008B15' }}>
              Master 4
            </span>
          </div>
          <p className="text-sm text-gray-300 italic leading-relaxed">
            &ldquo;Grinder is the best way to find practice partners. I&apos;ve been using it to grind Fox dittos and honestly the name just makes sense. 10/10 rebrand.&rdquo;
          </p>
        </div>
      </section>

      {/* App demo */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden shadow-2xl shadow-black/50 bg-black">
          <video
            className="w-full"
            autoPlay
            loop
            muted
            playsInline
            aria-label="Grinder app demo"
          >
            <source src={`${IMG_PREFIX}/demo.mp4`} type="video/mp4" />
            <source src={`${IMG_PREFIX}/demo.mov`} type="video/quicktime" />
          </video>
        </div>
      </section>

      {/* Setup steps — yellow themed */}
      <section className="mx-auto mt-14 max-w-3xl px-4">
        <div className="hidden sm:grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-y-4">
          <div className="flex flex-col items-center text-center px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-mono font-semibold" style={{ borderWidth: 1, borderColor: `${YELLOW}66`, color: YELLOW }}>1</span>
            <p className="mt-3 text-sm font-medium text-white">Install Grinder</p>
            <p className="mt-1 text-xs text-gray-500">Download the app and start grinding.</p>
          </div>
          <span className="mt-2 text-gray-600 text-lg select-none">&rarr;</span>
          <div className="flex flex-col items-center text-center px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-mono font-semibold" style={{ borderWidth: 1, borderColor: `${YELLOW}66`, color: YELLOW }}>2</span>
            <p className="mt-3 text-sm font-medium text-white">Sync with Discord</p>
            <p className="mt-1 text-xs text-gray-500">Sign in to link your Slippi tag.</p>
          </div>
          <span className="mt-2 text-gray-600 text-lg select-none">&rarr;</span>
          <div className="flex flex-col items-center text-center px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-mono font-semibold" style={{ borderWidth: 1, borderColor: `${YELLOW}66`, color: YELLOW }}>3</span>
            <p className="mt-3 text-sm font-medium text-white">Grind!</p>
            <p className="mt-1 text-xs text-gray-500">Find players near you and start grinding.</p>
          </div>
        </div>
        {/* Stacked on mobile */}
        <div className="flex flex-col gap-6 sm:hidden">
          {[
            { n: '1', title: 'Install Grinder', desc: 'Download the app and start grinding.' },
            { n: '2', title: 'Sync with Discord', desc: 'Sign in to link your Slippi tag.' },
            { n: '3', title: 'Grind!', desc: 'Find players near you and start grinding.' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-mono font-semibold" style={{ borderWidth: 1, borderColor: `${YELLOW}66`, color: YELLOW }}>{s.n}</span>
              <div>
                <p className="text-sm font-medium text-white">{s.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-14 pb-8 text-center text-xs text-gray-600">
        Grinder™ is a product of Lucky 7s. Not affiliated with Slippi, Nintendo, or any dating apps.
      </footer>
    </div>
  );
}
