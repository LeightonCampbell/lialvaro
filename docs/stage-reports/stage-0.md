# Stage 0 report — Audit and baseline

**Branch:** `cursor/stage-0-audit-ba6a`  
**Date:** 2026-10-21  
**Protocol:** Restate → assumptions → Stage 0 only → verify → this report → **STOP**

---

## Understanding (5 lines)

1. Stage 0 documents the current Astro/Cloudflare site and live production before any redesign.
2. No feature code: only audit docs, redirect proposal, and evidence artifacts.
3. Live URLs come from sitemap + nav/footer crawl; keep `/design-your-apparel`, `/about`, `/faq`, `/articles`, `/contact`.
4. Baselines are mobile Lighthouse scores, lab CWV proxies (LCP/CLS), and HTML weights.
5. Quote modal steps/fields and listed defects were verified against repo + live HTML.

## Assumptions

- Baseline codebase = this branch (aligned with current production shape), not unmerged printshop/Stripe PR #4.
- Canonical host should be `www.lialvaro.com`.
- Field CrUX data unavailable in this Lighthouse run.
- Formspree remains the live lead intake until later stages replace it.

## Owner gate decisions (recorded 2026-10-21)

1. **Brand:** LiAlvaro T-Shirt Printing  
2. **Canonical host:** www (`https://www.lialvaro.com`)  
3. **`/design-your-apparel/`:** 301 → `/design/` when Design Studio exists  

Still open (non-blocking): confirm prod = this Workers deploy (not PR #4); prefer 301 over 307 for slash normalization.

---

## What was built

| Deliverable | Path |
|---|---|
| Build plan (checked in) | `docs/BUILD_PLAN.md` |
| Audit | `docs/audit.md` |
| Redirect map | `docs/redirects.md` |
| This report | `docs/stage-reports/stage-0.md` |
| Lighthouse evidence | `docs/stage-reports/evidence/lighthouse-*-mobile.json` (+ home HTML) |

**Not built:** any page/component/API changes, redirects in Cloudflare, brand rename, typo fix merge.

---

## Evidence

### Commands / probes

- Live host headers: `curl -sSIL https://lialvaro.com/` and `https://www.lialvaro.com/` → both **200** (apex does not 301 to www).
- Slash: `/about` → **307** `/about/` on both hosts.
- Sitemap crawl: 8 URLs under www.
- Homepage contains `I gad my logo`, `LTP`, mixed brand strings, Privacy/Terms as `#`.
- Lighthouse 12 mobile (headless Chrome, `--no-sandbox`):

| Page | Perf | A11y | BP | SEO | LCP | CLS | Weight |
|---|---:|---:|---:|---:|---|---|---|
| Home | 94 | 95 | 96 | 92 | 2.9s | 0 | 270 KiB |
| FAQ | 99 | 95 | 100 | 92 | 1.7s | 0.001 | 75 KiB |
| Design Your Apparel | 99 | 95 | 100 | 92 | 1.7s | 0.003 | 75 KiB |

Raw JSON: `docs/stage-reports/evidence/`.

### Defect checklist (plan § Stage 0)

| Planned note | Verified |
|---|---|
| Canonical www vs apex serving | Yes — D1 |
| Brand inconsistency (Apparel / T-Shirt Printing / LTP) | Yes — D2 |
| Typo in first review (`gad`) | Yes — D3 (fix PR #5 not merged) |
| Privacy/Terms → `#` | Yes — D4 |

---

## Open issues

1. Production host redirect not applying repo middleware intent.  
2. Brand string undecided (blocks Stage 0 gate).  
3. SEO score 92 &lt; Stage 4 target 95; home LCP 2.9s &gt; Stage 4 2.5s budget.  
4. No `src/data/` yet — claims are hard-coded.  
5. Unmerged PR #4 would change IA significantly; must not be assumed until merged/rejected.

---

## Decisions needing the owner

| Topic | Status |
|---|---|
| Brand: LiAlvaro T-Shirt Printing | **Locked** |
| Canonical: www | **Locked** |
| `/design-your-apparel/` → `/design/` 301 | **Locked** (implement later) |
| 307 → 301 for trailing slash | Recommended; not yet confirmed |
| Explicit “audit approved” | Treated as approved via these gate answers |

---

## Gate

Per `docs/BUILD_PLAN.md`: *“owner approves the audit and the single brand name.”*

- Audit + redirects delivered: **yes**  
- Brand name: **LiAlvaro T-Shirt Printing**  
- Stage 0 gate: **closed** for brand + www + design redirect  

## STOP

Stage 0 complete. Redirect and brand rename are **not** implemented in this stage. Say when to run **Stage 1** only.
