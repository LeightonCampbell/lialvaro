/**
 * Astro's generated dist/server/wrangler.json keeps the SESSION binding name
 * but drops the KV namespace id. Restore it before wrangler deploy.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const TARGET = 'dist/server/wrangler.json';
const SESSION_ID = '5494cbe612244c9fa752e080e10d8145';

if (!existsSync(TARGET)) {
  console.error(`Missing ${TARGET} — run npm run build first.`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(TARGET, 'utf8'));
const kvs = Array.isArray(config.kv_namespaces) ? config.kv_namespaces : [];
config.kv_namespaces = kvs.some((k) => k.binding === 'SESSION')
  ? kvs.map((k) => (k.binding === 'SESSION' ? { ...k, id: SESSION_ID } : k))
  : [...kvs, { binding: 'SESSION', id: SESSION_ID }];

if (!config.assets) config.assets = {};
config.assets.run_worker_first = true;
config.assets.html_handling = config.assets.html_handling ?? 'force-trailing-slash';

writeFileSync(TARGET, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Patched ${TARGET}: SESSION=${SESSION_ID}, run_worker_first=true`);
