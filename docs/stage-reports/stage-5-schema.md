# Stage 5 — D1 schema (owner-fulfilled POD)

**Date:** 2026-10-26  
**Status:** Implemented in `migrations/0001_commerce_core.sql`  
**Owner lock:** No Printful/Printify. Store = vendor designs; LiAlvaro fulfills; vendors receive a cut.

## Model

| Concept | Meaning |
|---|---|
| `vendors` | Design partners |
| `products` | Store listings = vendor designs on blanks |
| `variants` | Size/color SKUs; lane default `local` |
| `order_items.vendor_cut_cents` | Partner share of that line |
| `vendor_payouts` | Owed → paid after owner remits |

## Flow

1. Customer buys a vendor design from `/shop/`  
2. Stripe Checkout → webhook creates `orders` + `order_items` (`status=queued`, lane=`local`)  
3. `vendor_payouts` rows created with `status=owed`  
4. Owner prints/ships from production queue (admin in Stage 7)  
5. After fulfillment, mark payouts `paid`

## Struck

External POD provider tables/ids (`provider_order_id`, Printful sync) — not used.
