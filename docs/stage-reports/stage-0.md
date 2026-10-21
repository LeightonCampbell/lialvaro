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

## Blocking questions (awaiting owner — Stage 0 gate)

1. Approve this audit as accurate?
2. **Single brand name** — which public string? (See `docs/audit.md` §6 options.)
3. Confirm canonical host stays **www**?
4. Keep `/design-your-apparel/` forever, or plan eventual 301 to `/design/`?
5. Confirm production is this Workers deploy (not PR #4)?

*Non-blocking clarifications are listed in the audit; work proceeded so deliverables exist for review.*

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

1. Approve `docs/audit.md` + `docs/redirects.md`.  
2. Choose the single public brand name.  
3. Canonical host (www recommended).  
4. Long-term fate of `/design-your-apparel/`.  
5. Whether 307 slash redirects should become 301.

---

## Gate

Per `docs/BUILD_PLAN.md`: *“owner approves the audit and the single brand name.”*

- Audit + redirects delivered: **yes**  
- Owner approval: **pending**  
- Brand name: **pending**

## STOP

Stage 0 complete for agent work. **Do not start Stage 1** until the owner closes the gate above.
