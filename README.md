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

## Owner-editable data

- `src/data/claims.json` — public claims
- `src/data/catalog.seed.json` — vendors + designs until D1 is populated
- `src/data/pricing.json` — vendor cut defaults, shipping estimate, tax
- `src/data/same-day.json` — ZIP allowlist + cutoff
- `src/data/site.json` — brand contact defaults

## Secrets

| Name | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verify |
| `RESEND_API_KEY` | Order emails |
| `ORDER_NOTIFICATION_EMAIL` | Owner inbox |

D1 binding: `DB` in `wrangler.jsonc` (replace placeholder `database_id` before deploy).
