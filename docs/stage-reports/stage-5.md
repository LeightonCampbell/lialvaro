# Stage 5 report — Commerce core (revised)

**Date:** 2026-10-26 (America/Los_Angeles)  
**Branch:** `cursor/stage-5-commerce-ba6a`  
**Owner pivot:** Do **not** use Printful. LiAlvaro offers POD itself; Store lists vendor designs; owner fulfills; vendors get a cut.

## Understanding

1. Money-in via Stripe; orders land in an **owner production queue** (not an external POD API).
2. Catalog = **vendor designs** with per-design `vendorCutBps`.
3. After payment, vendor cuts are recorded as **owed**; remitted after fulfillment (admin Stage 7).
4. Design Studio + quote-modal locks unchanged.
5. Gate: Stripe test checkout → order in production queue + webhook idempotency (Printful DRAFT gate **canceled**).

## What shipped

| Area | Notes |
|---|---|
| Schema | `vendors`, design `products`, `vendor_payouts`, local `order_items` |
| Seed store | Studio North / Eastside Ink sample designs |
| Stripe Checkout + webhook | Idempotent; queues production; emails owner + customer |
| Shop / PDP / cart / track | Vendor attribution on PDP |
| Pricing | `vendorCut` bps + blank cost (no Printful markup) |

## Removed

- Printful client, catalog sync API, `PRINTFUL_*` secrets
- External POD routing / DRAFT-order gate

## Verification

- `npm run build` after pivot
- Store lists vendor designs; PDP shows “Design by …”; cart add works

## Owner gate progress

1. **D1 `database_id`:** set to `26c850ff-29cb-434b-a9fa-08b3fe577b99` (`lialvaro-commerce`). Local + **remote** migrations applied (`0001_commerce_core.sql`) — **done**.
2. Stripe + Resend secrets — owner filled local `.dev.vars` (test Stripe + Resend + notification email); `stripe listen` for webhook secret — **local done**. Cloudflare Worker secrets for production still pending.  
3. Stripe test checkout + webhook: local `stripe listen` → `POST /api/stripe-webhook` **[200]**; Resend + owner inbox delivery **confirmed** — **done** (local). Cloudflare Worker secrets for production still pending.  
4. Vendor cut **20%** + sample catalog kept — **done** (owner 2026-10-27)  
5. Same-day: **≤12 pieces**, cutoff **11:00** PT, existing LA ZIP allowlist — **done** (owner 2026-10-27)  

## STOP

Revised Stage 5 ready for review. Do not reintroduce Printful. Do not start Stage 6 until owner accepts.
