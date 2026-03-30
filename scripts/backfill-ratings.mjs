/**
 * One-off backfill: populate player_ratings for all profiles with a connect_code.
 *
 * Usage (from repo root):
 *   node scripts/backfill-ratings.mjs
 *
 * Reads DATABASE_URL from .env (direct Postgres connection, bypasses RLS).
 * Requires Node 18+ (native fetch) and the `pg` package.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
const DATABASE_URL = dbUrlMatch[1].trim();

const RATING_QUERY = `
fragment profileFields on NetplayProfile {
  ratingOrdinal ratingUpdateCount wins losses __typename
}
query RatingLookup($cc: String, $uid: String) {
  getUser(connectCode: $cc, fbUid: $uid) {
    rankedNetplayProfile { ...profileFields __typename }
    rankedNetplayProfileHistory {
      ...profileFields
      season { id name status __typename }
      __typename
    }
    __typename
  }
}`.trim();

async function fetchSlippiRating(connectCode) {
  try {
    const res = await fetch('https://internal.slippi.gg/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'RatingLookup',
        variables: { cc: connectCode, uid: connectCode },
        query: RATING_QUERY,
      }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return null; }
    const user = data?.data?.getUser;
    if (!user) return null;

    const ranked = user.rankedNetplayProfile;
    const currentRating = ranked?.ratingOrdinal ?? null;
    const currentWins = ranked?.wins ?? 0;
    const currentLosses = ranked?.losses ?? 0;

    const history = user.rankedNetplayProfileHistory ?? [];
    const completedSeasons = history
      .filter((p) => p.season?.status !== 'active' && p.ratingOrdinal != null)
      .sort((a, b) => {
        const aId = parseInt(a.season?.id ?? '0', 10);
        const bId = parseInt(b.season?.id ?? '0', 10);
        return bId - aId;
      });
    const peakPastRating = completedSeasons.reduce(
      (max, p) => (max == null || p.ratingOrdinal > max ? p.ratingOrdinal : max), null);
    const lastSeasonRating = completedSeasons.length > 0 ? completedSeasons[0].ratingOrdinal : null;

    let effectiveRating;
    if (currentWins + currentLosses > 0) effectiveRating = currentRating;
    else if (lastSeasonRating != null) effectiveRating = lastSeasonRating;
    else effectiveRating = null;

    const seasons = history.map((p) => ({
      ratingOrdinal: p.ratingOrdinal ?? null,
      wins: p.wins ?? 0,
      losses: p.losses ?? 0,
      seasonId: p.season?.id ?? null,
      seasonName: p.season?.name ?? null,
      seasonStatus: p.season?.status ?? null,
    }));

    return { connectCode, currentRating, currentWins, currentLosses, peakPastRating, effectiveRating, seasons };
  } catch (e) {
    console.error(`  error fetching ${connectCode}:`, e.message);
    return null;
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  console.log('Fetching all connect codes from profiles...');
  const { rows } = await pool.query("SELECT connect_code FROM profiles WHERE connect_code IS NOT NULL");
  const codes = rows.map((r) => r.connect_code);
  console.log(`Found ${codes.length} profiles.\n`);

  const CONCURRENCY = 5;
  let done = 0;
  let inserted = 0;

  for (let i = 0; i < codes.length; i += CONCURRENCY) {
    const batch = codes.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchSlippiRating));

    for (const r of results) {
      if (!r) continue;
      try {
        await pool.query(
          `INSERT INTO player_ratings (connect_code, current_rating, current_wins, current_losses, peak_past_rating, effective_rating, seasons, fetched_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (connect_code) DO UPDATE SET
             current_rating = EXCLUDED.current_rating,
             current_wins = EXCLUDED.current_wins,
             current_losses = EXCLUDED.current_losses,
             peak_past_rating = EXCLUDED.peak_past_rating,
             effective_rating = EXCLUDED.effective_rating,
             seasons = EXCLUDED.seasons,
             fetched_at = NOW()`,
          [r.connectCode, r.currentRating, r.currentWins, r.currentLosses, r.peakPastRating, r.effectiveRating, JSON.stringify(r.seasons)]
        );
        inserted++;
      } catch (e) {
        console.error(`  DB error for ${r.connectCode}:`, e.message);
      }
    }

    done += batch.length;
    process.stdout.write(`\r  ${done}/${codes.length} fetched, ${inserted} inserted`);
  }

  console.log(`\n\nDone! Inserted/updated ${inserted} player ratings.`);
  await pool.end();
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
