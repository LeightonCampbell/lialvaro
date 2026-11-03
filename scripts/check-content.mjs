import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const banned = [
  'in-house',
  'shop floor',
  'our presses',
  'our facility',
  'on-site',
  'made in our studio',
  'our artisans',
  'printful',
  'printify',
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.wrangler') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function sourceLines(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('<!--');
    });
}

const failures = [];
const srcFiles = walk(join(root, 'src')).filter((path) => !path.endsWith(`${join('src', 'data', 'claims.json')}`));

for (const path of srcFiles) {
  if (!/\.(astro|ts|js|css|json)$/.test(path)) continue;
  const lines = sourceLines(path);
  lines.forEach((line, index) => {
    if (/\b(TODO|FIXME)\b/.test(line)) {
      failures.push(`${relative(root, path)}:${index + 1} has TODO or FIXME`);
    }
    const lower = line.toLowerCase();
    for (const phrase of banned) {
      if (lower.includes(phrase)) {
        failures.push(`${relative(root, path)}:${index + 1} uses banned phrase "${phrase}"`);
      }
    }
  });
}

const claims = JSON.parse(readFileSync(join(root, 'src', 'data', 'claims.json'), 'utf8'));
const publicCopy = srcFiles
  .filter((path) => path.includes(`${join('src', 'pages')}`) || path.includes(`${join('src', 'components')}`))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

for (const claim of claims.claims) {
  const text = String(claim.text ?? '').toLowerCase();
  for (const phrase of banned) {
    if (text.includes(phrase)) failures.push(`claims.json "${claim.id}" text uses banned phrase "${phrase}"`);
  }
  if (!claim.confirmed && publicCopy.toLowerCase().includes(text) && text.length > 12) {
    failures.push(`Unconfirmed claim "${claim.id}" appears in pages or components`);
  }
}

const claimIds = new Map(claims.claims.map((claim) => [claim.id, Boolean(claim.confirmed)]));
const used = publicCopy.matchAll(/claimText\(\s*['"]([^'"]+)['"]\s*\)/g);
for (const match of used) {
  const id = match[1];
  if (!claimIds.get(id)) failures.push(`claimText("${id}") is missing or not confirmed`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Content check passed (${srcFiles.length} source files).`);
