import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'hlpcaltsxcdxmolmpcxj';
const MANAGEMENT_API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN env var. Generate one at:');
  console.error('https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

async function runSQL(sql, label) {
  console.log(`Running: ${label}...`);
  const res = await fetch(MANAGEMENT_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

try {
  const migration = readFileSync(
    resolve(__dirname, '../supabase/migrations/001_initial_schema.sql'), 'utf-8'
  );
  await runSQL(migration, 'migration (001_initial_schema)');
  console.log('Migration applied successfully.\n');

  const seed = readFileSync(
    resolve(__dirname, '../supabase/seed.sql'), 'utf-8'
  );
  await runSQL(seed, 'seed data');
  console.log('Seed data inserted.\n');

  const tables = await runSQL(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    'verify tables'
  );
  console.log('Public tables:');
  tables.forEach(r => console.log(`  - ${r.tablename}`));
  console.log('\nDone!');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
