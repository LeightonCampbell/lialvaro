# Stage 5 report — Commerce core

**Date:** 2026-10-26 (America/Los_Angeles)  
**Branch:** `cursor/stage-5-commerce-ba6a`  
**Base:** `cursor/design-studio-nav-pivot-ba6a` (Stage 4 approved + IA locks)

## Understanding (Stage Protocol)

1. Stage 5 wires money-in / orders-out: D1 schema, Printful provider interface, pricing rules, shop/PDP/cart, Stripe Checkout + Tax, webhook idempotency, POD order routing, same-day request rules, Resend emails, `/track`.
2. Owner locks still apply: no `/custom-printing/` page; Design Studio remains order-ready; nav/hero unchanged except H1 already locked.
3. Page renders never call Printful — seed catalog (or D1 after sync) only.
4. Gate requires Stripe test order → Printful DRAFT + webhook replay — **blocked on secrets** (see open questions).
5. Schema proposed in `docs/stage-reports/stage-5-schema.md` and applied as `migrations/0001_commerce_core.sql`.

## What shipped

| Area | Location |
|---|---|
| D1 schema + migration | `migrations/0001_commerce_core.sql`, wrangler `DB` binding |
| Seed catalog | `src/data/catalog.seed.json` → `src/lib/catalog.ts` |
| Pricing / same-day / site | `src/data/pricing.json`, `same-day.json`, `site.json` |
| Printful v2 provider | `src/lib/provider/printful.ts` (+ types) |
| Order router + webhook idempotency | `src/lib/orders.ts`, `src/pages/api/stripe-webhook.ts` |
| Stripe Checkout | `src/pages/api/create-checkout-session.ts` (automatic_tax) |
| Catalog sync job | `src/pages/api/catalog-sync.ts` |
| Shop / PDP / cart / confirm / track | `src/pages/shop/*`, `cart/`, `order-confirmed/`, `track/` |
| Client cart | `src/scripts/cart.ts` |

## Verification

- `npm run build` — **pass** (shop PDPs + `/api/catalog.json` prerendered; checkout/webhook/track are server routes).
- Local storefront: seed products on `/shop/`, PDP add-to-cart, cart UI (Playwright/manual against seed catalog).
- Stripe/Printful live gate: **not run** — secrets not present in this environment.

## Open / blocking for owner

1. Provide Cloudflare **D1** database id (replace placeholder in `wrangler.jsonc`) and run `wrangler d1 migrations apply`.
2. Stripe test keys: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (and confirm Stripe Tax for CA).
3. Printful: `PRINTFUL_API_TOKEN`, optional `PRINTFUL_STORE_ID`; confirm catalog product IDs to sync (seed uses placeholders).
4. Resend: `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL`.
5. Confirm `pricing.json` markup **40%** and `same-day.json` ZIP/cutoff lists.

## Decisions needing owner

- Replace seed Printful variant IDs with real catalog IDs after first sync.
- Whether guest carts stay localStorage-only until Stage 7 accounts (current) vs early D1 carts.

## STOP

Stage 5 implementation scaffold complete for review. Full gate (test-mode Stripe → Printful DRAFT + webhook replay + forced failure → `needs_attention`) waits on secrets above. Do not begin Stage 6 until owner accepts Stage 5 / supplies credentials for gate evidence.
