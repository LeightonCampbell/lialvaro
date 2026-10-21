# Stage 2 report — Information architecture, flows, wireframes

**Branch:** `cursor/stage-2-ia-ba6a`  
**Base:** `cursor/stage-1-strategy-ba6a`  
**Date:** 2026-10-21  
**Protocol:** Restate → assumptions → Stage 2 only → verify → this report → **STOP**

---

## Understanding (5 lines)

1. Stage 2 locks sitemap, user flows, and low-fi layout wireframes before any styleguide or production page rebuild.
2. Customers see one storefront; fulfilment lanes stay internal.
3. Homepage structure follows Stage 1 hierarchy: Design primary, Quote secondary, one CTA per section.
4. Wireframes live at `/_preview/wireframes/*` with `noindex` — layout boxes only, no Stage 3 tokens.
5. Owner reviews screenshots at 375 / 768 / 1280; no Stage 3–9 work in this stage.

## Assumptions

- Stage 1 gate closed (strategy/copy approved; claims locked; keep “LTP” in Leighton review).
- Trailing-slash www canonical remains; `/design-your-apparel/` → `/design/` when Design ships.
- Quote entry = `/custom-printing/` page **and** global modal (same steps).
- Sign-in appears in chrome as a placeholder shell until Stage 7.
- No public `/same-day/` page; same-day stays claim + eligibility UX.

## Non-blocking questions (for gate)

1. Approve homepage section order as wireframed.  
2. Approve Shop as header primary button vs Design as hero primary (both kept).  
3. Approve quote = page + modal.  
4. Keep Sign-in chrome placeholder visible vs hide until Stage 7.  
5. Confirm no standalone `/same-day/` landing.

---

## What was built

| Deliverable | Path |
|---|---|
| Sitemap / IA | `docs/ia.md` |
| User flows (6) | `docs/flows.md` |
| Wireframe index + 11 pages | `public/_preview/wireframes/` |
| Shared layout-only CSS | `public/_preview/wireframes/wireframe.css` |
| Screenshots 375/768/1280 | `docs/stage-reports/evidence/wireframes/*` |
| This report | `docs/stage-reports/stage-2.md` |

### Wireframe pages

`index`, `home`, `shop`, `shop-category`, `shop-product`, `design`, `custom-printing`, `cart`, `order-confirmed`, `track`, `store`, `account`

### Flows documented

1. Browse → buy  
2. Design → buy  
3. Request quote  
4. Reorder  
5. Client store purchase  
6. Same-day inquiry  

**Not built:** styleguide, tokens, real pages, commerce, Design Studio canvas, redirects implementation, Stage 3+.

---

## Evidence / verification

| Check | Result |
|---|---|
| `docs/ia.md` exists with BUILD_PLAN routes | Yes |
| `docs/flows.md` covers required flows | Yes |
| `/_preview/wireframes/*` served locally | Yes (`curl` 200 on index, home, CSS) |
| `noindex,nofollow` on wireframe HTML | Yes |
| Layout-only styling (no brand tokens) | Yes — grayscale boxes / dashed slots |
| Homepage sections match Stage 1 + BUILD_PLAN | Yes |
| Playwright screenshots @ 375, 768, 1280 | Yes — 36 PNGs (12 pages × 3) |
| Public-language rule (no in-house / POD names) | Yes in IA/flows/wireframe notes |
| Stage 3+ not started | Yes |

### Screenshot index

Path pattern: `docs/stage-reports/evidence/wireframes/{page}-{375|768|1280}.png`

Preview locally while `npm run dev` is running:

- http://localhost:4321/_preview/wireframes/
- http://localhost:4321/_preview/wireframes/home.html

### Commands used

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/_preview/wireframes/home.html
# 200
# Playwright Chromium full-page screenshots for each wireframe at 375, 768, 1280
```

---

## Open issues

1. Sign-in chrome visibility until Stage 7 — owner preference (non-blocking Q4).  
2. Exact category slugs for `/shop/[category]/` TBD when catalog exists.  
3. Client-store cart “global cart with store context” is an assumption for Stage 5/7.  
4. Admin routes listed in IA only — no wireframes (owner-only; Stage 7).

---

## Decisions needing the owner (Stage 2 gate)

| Topic | Needed |
|---|---|
| Sitemap | Approve or edit |
| Six user flows | Approve or edit |
| Wireframe layouts (esp. home) | Approve via screenshots |
| Non-blocking Q1–Q5 | Answer if changing defaults |

Per BUILD_PLAN: *“owner approves wireframes.”*

- Deliverables ready: **yes**  
- Owner approval: **pending**  

---

## STOP

Stage 2 complete for implementation. Do **not** begin Stage 3 until the owner approves the wireframes.
