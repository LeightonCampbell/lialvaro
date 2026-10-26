# Stage 5 — D1 schema proposal

**Date:** 2026-10-26  
**Status:** Proposed and implemented in `migrations/0001_commerce_core.sql`  
**Owner review:** Confirm lanes, status enums, and markup rules in `src/data/pricing.json` before live Printful sync.

## Principles

- One storefront; lanes (`local` | `pod` | `broker`) live on `order_items`, never in public URLs.
- Page renders never call Printful — catalog pages read D1 (or seed JSON when D1 is empty).
- Stripe webhook events are stored by event id for idempotency.
- Prices shown to customers are **retail** (vendor cost + markup), computed server-side.

## Tables

| Table | Purpose |
|---|---|
| `users` | Accounts (magic-link Stage 7); optional email on guest orders |
| `products` | Storefront products synced from provider or seeded |
| `variants` | SKU / size / color / provider variant id / lane default |
| `stores` | Client storefronts (Stage 7); nullable FK on cart/order |
| `carts` / `cart_items` | Server-side carts (cookie id); guest OK |
| `orders` | Paid orders + Stripe session ids + status |
| `order_items` | Line items with `lane`, provider ids, fulfillment status |
| `quotes` | Broker quotes (Stage 8 fills out) |
| `designs` | Design Studio exports (Stage 6) |
| `events` | Audit log |
| `webhook_events` | Stripe (and later Printful) event ids |

## Status enums (text, checked in app)

- Order: `pending_payment` → `paid` → `routing` → `fulfilled` | `needs_attention` | `canceled`
- Order item: `pending` → `submitted` → `in_production` → `shipped` | `failed` | `needs_attention`

## Migrations

Versioned under `/migrations/` for Wrangler D1 (`wrangler d1 migrations apply`).
