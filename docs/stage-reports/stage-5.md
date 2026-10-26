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

## Still needed from owner

1. Real D1 `database_id` + migrations apply  
2. Stripe + Resend secrets  
3. Confirm default vendor cut (seed uses 20–25%) and real vendor/design catalog  
4. Same-day ZIP/cutoff confirmation  

## STOP

Revised Stage 5 ready for review. Do not reintroduce Printful. Do not start Stage 6 until owner accepts.
