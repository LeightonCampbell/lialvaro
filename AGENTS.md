# Agent notes

## Cursor Cloud specific instructions

This is a single Astro site (`lialvaro-redesign`). Day-to-day development is **local Vite/Astro**, not Cloudflare.

- Install: `npm install` (Node `>=22.12.0`; lockfile is npm).
- Run the app: `npm run dev` — http://localhost:4321 (`host: true` in `astro.config.mjs`).
- Typecheck: `npx astro check` (no ESLint config and no automated test suite in this repo).
- Production-style local build: `npm run build` writes `./dist/`.
- Do **not** use `npm run preview`, `npm run deploy`, or `wrangler` unless the task is specifically about the Cloudflare Workers adapter. Preview/deploy go through Wrangler; that is not the local workflow.

Quote and design forms POST to Formspree (`https://formspree.io/f/xnjoaoyw`). Submitting them from a cloud/agent session sends a real lead. For UI checks, complete the form locally and intercept the request instead of submitting to production Formspree.

Standard scripts and project layout are in `README.md` and `package.json`.
