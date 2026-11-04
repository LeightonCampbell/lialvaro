# Stage 8 rebuild pass — Quote modal + admin lines

**Date:** 2026-11-03 (America/Los_Angeles)  
**Branch:** `cursor/stage-6-design-studio-ba6a`  
**Base:** Stage 8 broker lane already shipped (`docs/stage-reports/stage-8.md`). This pass is the deferred modal/admin rebuild.

## Understanding

1. Quote entry stays a **global modal only** — no `/custom-printing/` page (OWNER_LOCKS).
2. Steps stay service → design → blanks/files → contact → success (flows.md).
3. Submissions stay in D1 via `POST /api/quotes`; owner still builds/pays via admin + `/quotes/[token]/`.
4. Visual chrome should match the live brand red quote tab (`#c8102e`), not emoji chrome.
5. Admin quote builder must support **multiple line items** (API already accepted `lines[]`).

## What changed

| Area | Notes |
|---|---|
| Quote modal | Step progress indicator; service marks instead of emoji; brand-red accent; cleaner upload/success states. |
| Admin | Quote forms load every saved line; Add line / Remove; save/send posts the full `lines` array. |
| Locks | `/custom-printing/` still 301 → `/?quote=1`. No public quote page added. |

## Still open / out of scope

- Print file bytes still not stored in R2.
- Soft-launch owner tasks (Stripe live webhook smoke, customer note) stay owner-side.
- Playwright quote flow coverage remains deferred.

## STOP

Rebuild pass ready for owner visual check. Soft-launch checklist remains owner-side.
