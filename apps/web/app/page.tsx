import { createClient } from '@/lib/supabase/server';
import { LandingCTAs } from '@/components/LandingCTAs';

export default async function HomePage() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('presence_log')
    .select('*', { count: 'exact', head: true })
    .in('status', ['online', 'in-game']);

  const onlineLabel =
    error || count == null ? '—' : `${count.toLocaleString()} players online now`;

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-slippi-border bg-gradient-to-b from-[#0f0f0f] to-slippi-darker">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-90" />
      <div className="relative px-4 py-16 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your Melee{' '}
            <span className="text-gradient-green">Social Network</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Slippi Friends links your Discord account, Slippi replays, and a lightweight desktop
            agent so you can track opponents, see when friends are queueing, and show off your
            ranked profile in one place.
          </p>
          <div className="mt-10">
            <LandingCTAs />
          </div>
          <p className="mt-8 font-mono text-sm text-[#21BA45]/90">{onlineLabel}</p>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              title: 'Track Opponents',
              body: 'Recent netplay matches surface automatically from your replay folder — revisit sets and add rivals as friends.',
            },
            {
              title: "See Who's Online",
              body: 'Live presence from the agent shows who is in queue or in-game so you can shoot codes without digging through DMs.',
            },
            {
              title: 'Build Your Profile',
              body: 'Verified Slippi stats, mains, rank badge, and optional socials — share one link for your connect code.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slippi-border bg-slippi-card/60 p-6 backdrop-blur-sm transition hover:border-[#21BA45]/25 glow-green-hover"
            >
              <h2 className="font-display text-lg font-semibold text-white">{f.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{f.body}</p>
            </div>
          ))}
        </div>

        <section id="agent" className="mx-auto mt-24 max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-white">Desktop agent</h2>
          <p className="mt-4 text-gray-400">
            Install the Slippi Friends agent on your PC or Mac. It watches your Slippi replay
            folder, updates your presence, and keeps your profile in sync — after you sign in with
            Discord.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Builds ship from the <span className="font-mono text-gray-400">apps/agent</span>{' '}
            workspace. Run locally with{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[#21BA45]">
              npm run dev:agent
            </code>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
