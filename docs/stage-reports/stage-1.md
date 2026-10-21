# Stage 1 report — Strategy and messaging

**Branch:** `cursor/stage-1-strategy-ba6a`  
**Date:** 2026-10-21  
**Protocol:** Restate → assumptions → Stage 1 only → verify → this report → **STOP**

---

## Understanding (5 lines)

1. Stage 1 defines audiences, homepage message hierarchy, voice, claims register, and copy — before IA/wireframes.
2. Brand locked as **LiAlvaro T-Shirt Printing**; same-day uses BUILD_PLAN public wording only.
3. No page UI, no styleguide, no commerce implementation in this stage.
4. Every public claim lives in `src/data/claims.json` with `confirmed: false` until the owner flips it.
5. Copy deck uses real homepage reviews and tags claim-dependent lines with `[claim:id]`.

## Assumptions

- Two customer paths (Design vs Quote) are the long-term homepage story.
- `/design/` replaces `/design-your-apparel/` via 301 later (Stage 0 decision).
- No review counts or “#1” claims without owner-supplied proof.
- Contact phone/email stay as on the current site pending claim confirmation.

## Owner gate decisions (recorded 2026-10-21)

1. **Strategy + copy approved**
2. **Claims:** `same-day-printing` true; `support-24-7` false; all other claims true
3. **Keep “LTP”** in Leighton C.’s review as written

---

## What was built

| Deliverable | Path |
|---|---|
| Strategy (audiences, hierarchy, voice) | `docs/strategy.md` |
| Copy deck + microcopy | `docs/copy-deck.md` |
| Claims register draft | `src/data/claims.json` |
| This report | `docs/stage-reports/stage-1.md` |

**Not built:** wireframes, components, pages, redirects, styleguide, Stage 2+.

---

## Evidence / verification

| Check | Result |
|---|---|
| Deliverables named in Stage 1 exist | Yes |
| `claims.json` parses as JSON | Yes (`node -e JSON.parse`) |
| All claims ship with `confirmed: false` | Yes (12 claims) |
| Same-day wording matches public-language rule | Yes (`same-day-printing` text) |
| No POD vendor names in strategy/copy | Yes |
| No fake scarcity / dark patterns | Explicitly forbidden in copy deck |
| Reviews are from current site | Yes (5 named reviews) |
| Brand string consistent with Stage 0 lock | LiAlvaro T-Shirt Printing |
| Screenshots | N/A — no new pages in Stage 1 |

### Claims IDs for owner flip

`same-day-printing`, `no-minimums`, `free-quote`, `support-24-7`, `quote-response-1-business-hour`, `turnaround-standard-5-7`, `turnaround-rush-4`, `la-local-delivery`, `phone-310-904-2655`, `email-help`, `methods-screen-dtg-dtf-embroidery`, `los-angeles`

---

## Open issues

1. Owner must confirm/edit each claim before any Stage 4 page publish.  
2. Leighton C. review still contains customer-written “LTP” — keep or ask to redact.  
3. No verifiable Google rating/count yet — omitted from copy.  
4. Trailing-slash 307→301 still recommended, not confirmed (Stage 0 leftover).

---

## Decisions needing the owner (Stage 1 gate)

1. Approve `docs/strategy.md`.  
2. Approve `docs/copy-deck.md` (or mark edits).  
3. Confirm/edit/delete each claim in `src/data/claims.json`.  
4. Keep “LTP” in Leighton C. quote as written?  

---

## Gate status

Per BUILD_PLAN: *“owner approves copy and confirms or edits each claim.”*

- Deliverables ready: **yes**  
- Owner approval: **pending**  

## STOP

Stage 1 agent work complete. **Do not start Stage 2** until the owner closes the gate above.
