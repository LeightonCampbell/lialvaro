/**
 * Push .dev.vars values to the Cloudflare Worker as secrets.
 * Usage: node scripts/put-worker-secrets.mjs
 * Requires: wrangler login (or CLOUDFLARE_API_TOKEN).
 *
 * For production money, STRIPE_* must be live keys — this script warns on sk_test_.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const REQUIRED = [
  'AUTH_SECRET',
  'RESEND_API_KEY',
  'ORDER_NOTIFICATION_EMAIL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TURNSTILE_SECRET_KEY',
  'TURNSTILE_SITE_KEY',
];

if (!existsSync('.dev.vars')) {
  console.error('Missing .dev.vars — copy from .dev.vars.example and fill values.');
  process.exit(1);
}

const raw = readFileSync('.dev.vars', 'utf8');
const values = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim()];
    }),
);

const missing = REQUIRED.filter((k) => !values[k]);
if (missing.length) {
  console.error('Missing in .dev.vars:', missing.join(', '));
  process.exit(1);
}

if (values.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.warn(
    'WARNING: STRIPE_SECRET_KEY is a test key. Soft-launch checkouts will not take real cards until you set sk_live_ + a live webhook secret.',
  );
}

for (const name of REQUIRED) {
  const value = values[name];
  const result = spawnSync('npx', ['wrangler', 'secret', 'put', name], {
    input: value,
    encoding: 'utf8',
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.status !== 0) {
    console.error(`Failed putting ${name}`);
    process.exit(result.status ?? 1);
  }
  console.log(`OK ${name}`);
}

console.log('All 7 Worker secrets set on lialvaro-redesign.');
