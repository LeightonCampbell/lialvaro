# LiAlvaro T-Shirt Printing (Astro)

Custom apparel site for LiAlvaro. Local day-to-day workflow is Vite/Astro (`npm run dev`), not Wrangler preview.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies (Node `>=22.12.0`) |
| `npm run dev` | Local app at http://localhost:4321 |
| `npm run build` | Production build → `./dist/` |
| `npx wrangler d1 migrations apply lialvaro-commerce --local` | Apply D1 migrations locally |

## Owner-editable data

- `src/data/claims.json` — public claims (`confirmed: true` only)
- `src/data/pricing.json` — markup / tax / shipping rules
- `src/data/same-day.json` — ZIP allowlist + cutoff
- `src/data/catalog.seed.json` — storefront catalog until Printful sync fills D1
- `src/data/site.json` — brand contact defaults

Locked chrome/IA: `docs/OWNER_LOCKS.md`. Staged plan: `docs/BUILD_PLAN.md`.

## Secrets (Cloudflare / `.env`)

| Name | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verify (`constructEventAsync`) |
| `RESEND_API_KEY` | Order emails |
| `ORDER_NOTIFICATION_EMAIL` | Owner inbox for new orders |
| `PRINTFUL_API_TOKEN` | Printful API v2 |
| `PRINTFUL_STORE_ID` | Optional store header |
| `CATALOG_SYNC_SECRET` | Protects `POST /api/catalog-sync` |

D1 binding: `DB` (see `wrangler.jsonc`). Replace the placeholder `database_id` with a real D1 id before deploy.

## Commerce notes (Stage 5)

- Shop pages read the seed catalog (or D1 after sync). They never call Printful at request time.
- Cart is client-side (`localStorage`) → `POST /api/create-checkout-session` → Stripe Checkout (automatic tax).
- `POST /api/stripe-webhook` records idempotent events, writes orders, routes `pod` lines to Printful **draft** orders, emails customer + owner.
- Track: `/track/?code=…` (requires D1).
