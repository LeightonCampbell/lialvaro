# LiAlvaro T-Shirt Printing (Astro)

Custom apparel site for LiAlvaro. Local day-to-day workflow is Vite/Astro (`npm run dev`).

**Current work branch (cloud + local):** `cursor/stage-6-design-studio-ba6a`. Use that branch for Design Studio — not `master` (production) and not the live site until Stage 6 is merged/deployed. See `AGENTS.md` for the reset commands.

## Model (locked)

- **Store** lists designs from **vendors**.
- **LiAlvaro fulfills** every store order (owner POD — no Printful/Printify).
- After fulfillment, **vendors receive their cut** (tracked as payouts).
- **Design Studio** = customer-ready-to-order path; other custom work uses the **quote modal**.

See `docs/OWNER_LOCKS.md`.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies (Node `>=22.12.0`) |
| `npm run dev` | Local app at http://localhost:4321 |
| `npm run build` | Production build → `./dist/` |
| `npx wrangler d1 migrations apply lialvaro-commerce --local` | Apply D1 migrations locally |
| `npm run check:content` | Banned phrases, TODOs, and unconfirmed claims |
| `npm run test:e2e` | Playwright: pages, axe, login, reorder, store checkout |
| `npm run test:load` | Small parallel checkout-session check against local |

## Owner-editable data

- `src/data/claims.json` — public claims
- `src/data/catalog.seed.json` — vendors + designs until D1 is populated
- `src/data/pricing.json` — vendor cut defaults, shipping estimate, tax
- `src/data/same-day.json` — ZIP allowlist + cutoff
- `src/data/site.json` — brand contact defaults
- `src/data/stores.json` — client store slugs, vendor, and markup

## Secrets

| Name | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verify |
| `RESEND_API_KEY` | Order emails |
| `ORDER_NOTIFICATION_EMAIL` | Owner inbox. This address is the only one that can open `/admin/`. |
| `AUTH_SECRET` | Signs magic-link and session cookies. Required in production. |
| `TURNSTILE_SECRET_KEY` | Verifies quote and sign-in submissions. Required in production. |
| `TURNSTILE_SITE_KEY` | Public Turnstile widget key, rendered into those forms. |

Set the same names with `wrangler secret put` before a production deploy. Do not commit `.dev.vars`. Without `TURNSTILE_SECRET_KEY`, production quote and sign-in requests fail closed. Local dev skips Turnstile until both keys are set.

Apply `migrations/0002_members.sql` and `migrations/0003_broker_quotes.sql` to the remote D1 database as part of that deploy. Local apply does not update production.

D1 binding: `DB` in `wrangler.jsonc` (replace placeholder `database_id` before deploy).
