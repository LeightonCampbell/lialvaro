# Stage 7 report — Members, client stores, admin

**Date:** 2026-10-30 (America/Los_Angeles)  
**Branch:** `cursor/stage-6-design-studio-ba6a`  
**Base:** Stage 6 Design Studio, plus the homepage width/hero pass on this branch.

## What shipped

| Area | Notes |
|---|---|
| Magic-link sign-in | `POST /api/auth/magic` emails a 20-minute link. No passwords. Session cookie `lialvaro_session` lasts 30 days. |
| Account `/account/` | Order history, saved designs, addresses, sign out. Guest Design Studio ids attach on the signed-in page. Reorder loads that order back into the cart. |
| Client stores | `/stores/` and `/stores/[slug]/` from `src/data/stores.json`. Seed partners Studio North and Eastside Ink, markup 0 so prices match the shop. A non-zero markup is applied on the server at checkout only when the store sells that vendor’s design. |
| Admin `/admin/` | 401 when signed out, 403 for any email other than `ORDER_NOTIFICATION_EMAIL`. Production queue, same-day list, needs-attention list, status updates, one-piece margin table. |
| Migration | `migrations/0002_members.sql` adds `magic_links` and `addresses`. Applied to the local D1 database. |

## Homepage mobile (done before this stage)

At 390px the hero headline, buttons, and circular photo are centered. The top bar stacks and centers. There is no horizontal scroll. The header shows Menu; Get a quote stays inside that menu. At 1236px the hero copy still lines up with the logo (left 51) and the photo column still lines up with the quote button (right 1171).

## Gate evidence

- Unsigned `GET /admin/` → **401**. Signed-in non-owner → **403**.
- Magic link for a test address returned a local dev link (Resend is not configured here). Opening it rendered “Your account” and stored the link as used.
- `POST /api/account/address` with that session returned `{ ok: true }`. The row is in local D1 (`1 Main St`, Los Angeles, CA 90012).
- `/stores/studio-north/` lists LA Sunrise Tee and Script Cap only.
- Playwright is not in this repo, so login, reorder, and a client-store purchase were not run as an automated suite. Reorder has no paid order to click in this local database. Checkout was not submitted.

## Open items

1. Set `AUTH_SECRET` and `RESEND_API_KEY` before production sign-in. Without Resend, production returns 503 instead of a link.
2. Apply `0002_members.sql` to the remote D1 database at deploy. Local apply does not update production.
3. Catalog and store edits stay in `src/data/catalog.seed.json` and `src/data/stores.json` until the database is the catalog source.
4. Full Playwright coverage is still deferred.
5. Artwork files stay in the design record. There is no separate file library beyond saved designs.

## STOP

Stage 7 is ready for owner review. Do not start Stage 8 from this report.
