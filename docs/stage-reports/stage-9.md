# Stage 9 report — Hardening and launch prep

**Date:** 2026-11-01 (America/Los_Angeles)  
**Branch:** `cursor/stage-6-design-studio-ba6a`

## What shipped

| Area | Notes |
|---|---|
| Security headers | `nosniff`, referrer policy, `DENY` framing, and a locked-down permissions policy on every response. HSTS and Content-Security-Policy are added in production. Dev skips CSP so the Vite server keeps working. |
| Uploads | Quote files and Design Studio uploads must match PNG, JPG, GIF, WEBP, SVG, PDF, AI, EPS, or ZIP bytes, and stay under 8 MB. SVG scripts are rejected. Bytes are still not stored. |
| Turnstile and rate limits | Quote and sign-in forms render Turnstile when `TURNSTILE_SITE_KEY` is set. Production fails closed without `TURNSTILE_SECRET_KEY`. Local dev skips it until both keys exist. Quote posts are limited to 8 per hour per address. Sign-in keeps the existing email limit plus 10 per hour per address. |
| Logs | Webhook signature errors have email addresses redacted before they are returned. |
| Content check | `npm run check:content` fails on banned public phrases, `TODO`/`FIXME` in `src`, unconfirmed claim text on pages, and `claimText()` calls that are not confirmed. |
| Playwright | `tests/stage9.spec.ts` covers templates with axe, the custom-printing redirect, admin 401, the quote modal without submitting, a Studio North add-to-cart through Stripe test Checkout, Design Studio through test Checkout, and sign-in plus reorder. |
| CI | `.github/workflows/ci.yml` runs the content check, local D1 migrations, Playwright, the production build, and a Lighthouse job. |
| Launch notes | `docs/ops/launch-checklist.md` and `docs/ops/weekly-metrics.md`. |

## Gate evidence

- `npm run check:content` — passed, 94 source files.
- `npx playwright test` — 7 passed. Checkout tests reached `checkout.stripe.com` in test mode and did not pay.
- `npm run build` — complete, exit 0.
- `npm run test:load` — 8 parallel checkout-session calls, all HTTP 200. Those are unpaid test sessions.
- A file named `.png` whose bytes are plain text — `POST /api/quotes` returned 400 and did not save a quote.
- Homepage response includes `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy`, and `permissions-policy`.

## Open items

1. Owner sign-off is still required. This stage was not deployed.
2. Live redirects (`lialvaro.com` to `www`, `/custom-printing/`, `/design-your-apparel/`) were checked on localhost only. Confirm them on the production host after deploy.
3. Set `AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, and the Stripe secrets on the Worker. Apply `migrations/0002_members.sql` and `migrations/0003_broker_quotes.sql` to remote D1.
4. Lighthouse budgets are in `lighthouserc.cjs` and the CI job. They were not run on this machine.
5. CSP still allows inline scripts so JSON-LD and the current page scripts work. Framing and object embedding are blocked.
6. Rate limits live in each Worker isolate’s memory. They are not a global counter.
7. The soft-launch note to existing customers is a checklist item. No customer list was emailed.
8. Catalog editing, print-file storage, hat photos, and a broader Playwright suite beyond this file stay where they were.

## Decisions

- Production quote and sign-in fail closed without Turnstile. Local work continues without the keys.
- Checkout load test and Playwright open Stripe test Checkout only. No card was charged.
- Content-Security-Policy is production-only.

## STOP

Stage 9 is ready for owner review. Do not start a later stage from this report.
