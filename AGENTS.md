# Agent notes

## Cursor Cloud specific instructions

This is a single Astro site (`lialvaro-redesign`). Day-to-day development is **local Vite/Astro**, not Cloudflare.

- Install: `npm ci` (preferred) or `npm install` (Node `>=22.12.0`; lockfile is npm).
- Run the app: `npm run dev` — http://localhost:4321 (`host: true` in `astro.config.mjs`).
- Typecheck: `npx astro check` (no ESLint config and no automated test suite in this repo).
- Production-style local build: `npm run build` writes `./dist/`.
- Do **not** use `npm run preview`, `npm run deploy`, or `wrangler` unless the task is specifically about the Cloudflare Workers adapter. Preview/deploy go through Wrangler; that is not the local workflow.
- **Pin:** keep `astro` at `^6.0.4` with `@astrojs/cloudflare` `^13.x` until an intentional upgrade. Do not run `npx @astrojs/upgrade` or bump to Astro 7 without also moving to `@astrojs/cloudflare` 14+ and re-validating `npm run dev`.
- **Dev crash `Missing field moduleType`:** usually means `node_modules` drifted to Astro 7 / Vite 8 while the Cloudflare adapter is still on the Astro 6 line. Fix: `git checkout -- package.json package-lock.json && npm ci`, then `npm run dev` again.

Quote and design forms POST to Formspree (`https://formspree.io/f/xnjoaoyw`). Submitting them from a cloud/agent session sends a real lead. For UI checks, complete the form locally and intercept the request instead of submitting to production Formspree.

Standard scripts and project layout are in `README.md` and `package.json`.
