# Stage 3 report — Design system and living styleguide

**Branch:** `cursor/stage-3-design-system-ba6a`  
**Base:** `cursor/stage-2-ia-ba6a`  
**Date:** 2026-10-24  
**Protocol:** Restate → assumptions → Stage 3 only → verify → this report → **STOP**

---

## Understanding (5 lines)

1. Stage 3 locks look-and-feel tokens, self-hosted fonts, motifs, and an Astro component inventory before rebuilding live pages.
2. Living styleguide is noindex at `/_styleguide/` (rewrites to `/styleguide/` because Astro ignores `_`-prefixed page folders).
3. Live marketing pages still use `global.css` / existing Header/Footer until Stage 4.
4. Component states (default, hover, focus, disabled, loading, error, empty) are documented on the styleguide.
5. Gate requires owner look approval + axe zero critical/serious on the styleguide.

## Assumptions

- Stage 2 wireframes approved 2026-10-24 (defaults accepted).
- BUILD_PLAN font stack (Anton / Inter / IBM Plex Mono) is authoritative for this stage.
- DS components live under `src/components/ds/` so production chrome is untouched until Stage 4.
- Brand gold `#B8912A` / mesh `#8B8B85` remain for fills; AA text uses `--gold-text` / `--mesh-text`.

## Non-blocking questions (for gate)

1. Approve canvas / ink / print-red / gold / mesh palette as rendered.  
2. Approve hangtag ProductCard + registration/cutline motifs.  
3. Approve header primary = Shop now, secondary = Get a quote (matches Stage 2).  
4. Any token renames before Stage 4 foundation build?

---

## What was built

| Deliverable | Path |
|---|---|
| Tokens | `src/styles/tokens.css` |
| Self-hosted fonts | `src/styles/fonts.css` + `public/fonts/*.woff2` |
| DS components | `src/components/ds/*` |
| Styleguide layout | `src/layouts/StyleguideLayout.astro` |
| Styleguide page | `src/pages/styleguide/index.astro` (`prerender = false`) |
| `/_styleguide/` rewrite | `src/middleware.ts` |
| Screenshots | `docs/stage-reports/evidence/styleguide/styleguide-{375,768,1280}.png` |
| Axe evidence | `docs/stage-reports/evidence/styleguide/axe-styleguide.json` |
| Stage 2 gate close | `docs/stage-reports/stage-2.md` |
| This report | `docs/stage-reports/stage-3.md` |

### Component inventory

Button, Field (input/select/textarea), FileDrop, ProductCard, PriceTag, Badge, Header (+ Nav / MobileMenu), Footer, Section, Accordion, ReviewCard, StepList, Modal, Drawer, Toast, Photo.

**Not built:** Stage 4 page rebuild, commerce, Design Studio canvas, production token cutover.

---

## Evidence / verification

| Check | Result |
|---|---|
| Tokens match BUILD_PLAN hex values | Yes |
| Fonts self-hosted + preloaded | Yes (`public/fonts`, preload in StyleguideLayout) |
| Motifs: reg marks + cutlines + hangtag cards | Yes |
| Styleguide `noindex,nofollow` | Yes |
| `/_styleguide/` serves styleguide | Yes (200, rewrite) |
| Screenshots @ 375 / 768 / 1280 | Yes |
| axe critical/serious on styleguide | **0** (`axe-styleguide.json`) |
| Live homepage unchanged by DS cutover | Yes (DS isolated) |

### Commands

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4321/_styleguide/
# 200
# Playwright + @axe-core/playwright → docs/stage-reports/evidence/styleguide/axe-styleguide.json
```

### Preview

http://localhost:4321/_styleguide/

---

## Open issues

1. Production pages still on legacy orange/Manrope system until Stage 4.  
2. `@astrojs/check` not installed in repo — skipped interactive typecheck install.  
3. Modal/Drawer full-viewport behavior demonstrated via components + inline static demos (keeps styleguide scrollable).

---

## Decisions needing the owner (Stage 3 gate)

| Topic | Status |
|---|---|
| Look / tokens / motifs | **Approved** |
| Component inventory on styleguide | **Approved** |
| axe zero critical/serious | **Met (0)** |

Per BUILD_PLAN: *“owner approves look; axe reports zero critical/serious issues on the styleguide.”*

- Deliverables ready: **yes**  
- axe critical/serious: **0**  
- Owner look approval: **closed 2026-10-26**  

---

## STOP

Stage 3 gate closed. Say when to run **Stage 4 only**.
