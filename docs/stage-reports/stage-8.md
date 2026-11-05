# Stage 8 report — Broker lane and quote flow

**Date:** 2026-11-01 (America/Los_Angeles)  
**Branch:** `cursor/stage-6-design-studio-ba6a`  
**Base:** Stage 7 members and admin, plus the homepage header and width pass on this branch.

## What shipped

| Area | Notes |
|---|---|
| Quote modal | Still the global modal. It now posts to `POST /api/quotes` and stores the request in D1. It does not post to Formspree. `/custom-printing/` still 301s to `/?quote=1`. |
| Migration | `migrations/0003_broker_quotes.sql` adds quote totals, a public token, and `quote_items`. Applied to the local D1 database only. |
| Admin builder | `/admin/` lists requests. The owner saves one line, partner cost, markup, and deposit, then emails the quote page, records payment, or marks the job on the way, delivered, or canceled. |
| Customer page | `/quotes/[token]/` shows the line, the amount due now, any balance remaining, and the tracking link after payment. |
| Payment | `POST /api/quotes/pay` opens Stripe Checkout for a quote whose status is `quoted`. The webhook marks that checkout paid and creates the order before the cart path. Without a completed checkout, Record payment does the same with a manual session id. |
| Analytics | Opening the quote tab stores `quote_started` and `quote_step_N`. Those rows show under Quote activity. |

## Gate evidence

Local request for Ava Tester, screen printing, 24 pieces:

1. `POST /api/quotes` returned `{ ok: true, emailed: true }`. Status `open`.
2. Owner send saved one line at $8.50 (total $204.00), partner $80.00, markup $40.00, deposit $50.00. Status `quoted`. The customer email to the fake address returned `emailed: false`. The quote page was still saved.
3. `POST /api/quotes/pay` returned a Stripe test Checkout URL. That checkout was not completed and no card was charged.
4. Record payment created order `ord_794e1e50a07148f980dd3c0dfddbbf67` and tracking code `LAMVYY6FS5190Z`. Status `paid`.
5. Status updates set the quote to `tracked`, then `delivered`. The linked order ended as `fulfilled`.
6. `/quotes/778cd41c5b36e1de3c61b3d5a447c4034003/` shows Delivered, “Screen print, 1 color” × 24 for $204.00, due now $50.00, balance remaining $154.00, and the tracking code.
7. `/track/?code=LAMVYY6FS5190Z` shows status fulfilled and the same line.
8. Quote activity lists `quote_started`, `quote_step_N` steps 1 and 2, `quote_submitted`, `quote_sent`, `quote_paid`, and both status changes.
9. `GET /custom-printing/` returns 301 to `/?quote=1`.

The deposit is the amount due now. The remainder is shown as a balance. It is not charged automatically.

## Open items

1. Apply `migrations/0002_members.sql` and `migrations/0003_broker_quotes.sql` to the remote D1 database at deploy. Local apply does not update production.
2. Set `AUTH_SECRET` before production sign-in. This local machine is still on the dev-only signing secret.
3. Quote file uploads record the file name, size, and type. The bytes are not stored.
4. The admin form edits one line. Saving replaces every line on that quote with the line in the form.
5. The customer quote email failed for `quote-check@example.com`. A real customer address still needs a successful send before launch.
6. Playwright is still not in this repo, so this gate was checked in the browser and with local API calls.
7. Catalog and store edits stay in `src/data/catalog.seed.json` and `src/data/stores.json`.

## STOP

Stage 8 is ready for owner review. Do not start Stage 9 from this report.
