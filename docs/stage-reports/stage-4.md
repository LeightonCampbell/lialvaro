# Stage 4 report — Foundation build (real pages, no commerce)

**Branch:** `cursor/stage-4-foundation-ba6a`  
**Base:** `cursor/stage-3-design-system-ba6a`  
**Date:** 2026-10-26  
**Protocol:** Restate → assumptions → Stage 4 only → verify → this report → **STOP**

---

## Understanding (5 lines)

1. Stage 4 rebuilds the public front end on the Stage 3 design system — layout, homepage, and existing routes — without commerce backends.
2. Canonical host remains `www.lialvaro.com`; middleware enforces host, trailing slash, and `/design-your-apparel/` → `/design/`.
3. Copy uses only confirmed claims from `src/data/claims.json`; Privacy/Terms are scaffolds with TODO banners.
4. Analytics events are scaffolded; owner still chooses GA4 vs Plausible (+ Clarity).
5. Gate evidence is Lighthouse mobile on a production static build; Cloudflare preview deploy needs owner Wrangler auth.

## Assumptions

- Stage 3 look approved 2026-10-26.
- `/shop/` and `/cart/` ship as empty shells (commerce is Stage 5).
- `/design/` is foundation intake (form); full Design Studio canvas is Stage 6.
- `/custom-printing/` is quote entry + methods; modal remains global.
- Sign-in / account remain placeholder until Stage 7.

## Non-blocking questions (for gate)

1. Choose analytics: **GA4** or **Plausible**? Enable **Clarity** yes/no? (`src/data/analytics.json`)  
2. Supply final Privacy / Terms legal text to replace TODO scaffolds.  
3. Confirm Cloudflare preview/deploy when Wrangler credentials are available.  
4. Optional: public street address for richer LocalBusiness JSON-LD.

---

## What was built

| Area | Notes |
|---|---|
| Layout | `src/layouts/Layout.astro` — tokens, DS Header/Footer, QuoteModal, OG tags, JSON-LD slot, analytics scaffold |
| Homepage | New structure per Stage 2 wireframe + Stage 1 copy + DS |
| Ported pages | About, FAQ, Articles, Contact, article guides |
| New routes | `/design/`, `/shop/`, `/custom-printing/`, `/privacy/`, `/terms/`, `/cart/`, `/account/` |
| Redirects | Middleware: apex→www, trailing slash 301, design-your-apparel→design |
| SEO | Updated `public/sitemap.xml`, `public/robots.txt`, LocalBusiness + FAQPage JSON-LD |
| Claims helper | `src/lib/claims.ts` |
| Analytics | `src/scripts/analytics.ts` + `src/data/analytics.json`; quote/design events wired |
| Stage 3 gate | Closed in `docs/stage-reports/stage-3.md` |

**Not built:** Stripe/cart commerce, Design Studio canvas, Printful, admin, broker quote builder (Stages 5–8).

---

## Evidence / verification

### Build & URLs

| Check | Result |
|---|---|
| `npm run build` | Success |
| Production static preview `serve dist/client -l 4322` | 200 on keep + new routes |
| `/design-your-apparel/` → `/design/` | 301 |
| `/about` → `/about/` | 301 |
| Privacy/Terms real routes (not `#`) | Yes |

### Lighthouse mobile (production static)

Source: `docs/stage-reports/evidence/lighthouse-stage4/summary.json`

| Page | Perf | A11y | BP | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Home `/` | **98** | **100** | 100 | **100** | 2.26s | 0 |
| FAQ `/faq/` | **100** | **100** | 100 | **100** | 1.65s | 0 |
| Design `/design/` | **100** | **100** | 96 | **100** | 1.66s | ~0 |

Gate targets: perf ≥ 90, a11y ≥ 95, SEO ≥ 95 — **met** on production build.  
Perf budget (LCP &lt; 2.5s, CLS &lt; 0.1) — **met** on sampled pages.  
Note: Dev-server Lighthouse is not used (Astro toolbar / unminified JS skew scores).

### Cloudflare preview URL

**Not published this run** — `wrangler whoami` reports unauthenticated. Owner must run Wrangler login/deploy for a Workers preview URL. Local production static evidence above stands in for score gate.

---

## Open issues

1. Analytics provider unset (`src/data/analytics.json` → `provider: null`).  
2. Privacy/Terms TODO banners until owner legal text.  
3. Shop catalog empty until Stage 5.  
4. Design Studio canvas deferred to Stage 6 (intake form live at `/design/`).  
5. Cloudflare preview URL pending credentials.

---

## Decisions needing the owner (Stage 4 gate)

| Topic | Status |
|---|---|
| Foundation pages / redirects / SEO | Ready for review |
| Lighthouse scores | **Met** (see table) |
| Cloudflare preview URL | **Blocked on Wrangler auth** |
| GA4 vs Plausible + Clarity | Needs owner answer |
| Privacy/Terms final copy | Needs owner text |

Per BUILD_PLAN: *“Cloudflare preview URL; Lighthouse mobile perf ≥ 90, a11y ≥ 95, SEO ≥ 95; every old URL resolves or 301s.”*

- Deliverables ready: **yes**  
- LH scores: **met (prod static)**  
- Old URLs resolve/301: **yes**  
- CF preview: **pending owner auth**  
- Owner acceptance: **pending**

---

## STOP

Stage 4 complete for implementation. Do **not** begin Stage 5 until the owner accepts this foundation (and preferably supplies analytics + legal text).

**Owner approved Stage 4 on 2026-10-26** (plus Design Studio / quote-modal IA pivot and FAQ/H1 updates). Stage 5 opened on `cursor/stage-5-commerce-ba6a`.
