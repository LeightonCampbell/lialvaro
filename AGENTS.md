# Agent notes

## Cursor Cloud specific instructions

This is a single Astro site (`lialvaro-redesign`). Day-to-day development is **local Vite/Astro**, not Cloudflare.

### Single source of truth (cloud + local)

- **Active work branch:** `cursor/stage-6-design-studio-ba6a` (latest Design Studio). Cloud agent and local machine must use this same branch.
- **`master` is production-ish** and does **not** include Stage 5–6 work. Do not judge Design Studio from `master` or from lialvaro.com until Stage 6 is merged/deployed.
- **Local reset to match cloud latest:**
  ```powershell
  cd path\to\lialvaro
  git fetch origin
  git checkout cursor/stage-6-design-studio-ba6a
  git reset --hard origin/cursor/stage-6-design-studio-ba6a
  npm install
  # stop every old Astro window, then:
  npm run dev
  ```
  Open only the Local URL printed in that terminal (often `http://localhost:4321/design/` — if 4321 is busy it may be 4322). Hard-refresh the browser.
- Do not run two `npm run dev` servers at once; kill extras so cloud/local aren’t compared across stale ports.

### Day-to-day commands

- Install: `npm install` (Node `>=22.12.0`; lockfile is npm).
- Run the app: `npm run dev` — http://localhost:4321 (`host: true` in `astro.config.mjs`).
- Typecheck: `npx astro check` (no ESLint config and no automated test suite in this repo).
- Production-style local build: `npm run build` writes `./dist/`.
- Do **not** use `npm run preview`, `npm run deploy`, or `wrangler` unless the task is specifically about the Cloudflare Workers adapter. Preview/deploy go through Wrangler; that is not the local workflow.

Quote and design forms POST to Formspree (`https://formspree.io/f/xnjoaoyw`). Submitting them from a cloud/agent session sends a real lead. For UI checks, complete the form locally and intercept the request instead of submitting to production Formspree.

Standard scripts and project layout are in `README.md` and `package.json`.
