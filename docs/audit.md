# LiAlvaro Stage 0 audit

**Date:** 2026-10-21  
**Repo baseline branch:** `cursor/stage-0-audit-ba6a` (from `cursor/local-dev-setup-ba6a` / current `master`-line Astro app)  
**Live site audited:** `https://www.lialvaro.com` and `https://lialvaro.com`  
**Plan:** `docs/BUILD_PLAN.md` Stage 0 only — documentation, no feature code.

---

## 1. Understanding (Stage Protocol)

1. Stage 0 inventories what exists in the repo and on production before any redesign/commerce work.
2. Deliverables are `docs/audit.md` and `docs/redirects.md`; no Stage 1+ files or feature code.
3. Baselines come from live Lighthouse (mobile) + HTML document weights + nav/sitemap crawl.
4. Defects called out in the plan (host/canonical, brand strings, review typo, Privacy/Terms `#`) are verified.
5. The multi-step quote modal is documented field-by-field for later Stage 8 rebuild.

### Assumptions

- Production matches the Astro app on `master` / this baseline (not unmerged PR branches).
- Canonical host *should* be `www.lialvaro.com` (sitemap, Layout, middleware intent); apex currently also serves 200.
- Formspree endpoint `https://formspree.io/f/xnjoaoyw` is the live quote/design intake.
- Unmerged PRs (`homepage-printshop-look`, typo fix) are **not** live; noted as parallel work only.
- Chrome UX Report / field CWV was not returned by Lighthouse for this origin in this run.

### Owner decisions (locked 2026-10-21)

| Decision | Owner answer | Applies when |
|---|---|---|
| Public brand name | **LiAlvaro T-Shirt Printing** | Stage 1+ copy; Stage 4 title/chrome pass |
| Canonical host | **`www.lialvaro.com`** | Stage 4 host 301 + sitemap/canonical |
| `/design-your-apparel/` | **301 → `/design/`** | Stage 4/6 when `/design/` ships (keep page until then) |

Short UI form **LiAlvaro** (logo) remains acceptable; retire **LiAlvaro Apparel**, **LTP**, and mixed “T-shirt” casing in new copy. Do not invent a legal entity name beyond what the owner set.

### Remaining open (non-blocking for Stage 0 gate)

- Confirm production source of truth is this Workers deploy (not unmerged printshop PR #4).
- Same-day is currently homepage/FAQ copy only (no `/same-day` route) — confirmed by audit.

---

## 2. Repository summary

| Item | Current state |
|---|---|
| Package name | `lialvaro-redesign` `0.0.1` |
| Astro | `^6.0.4` (resolved v6.0.4) |
| Adapter | `@astrojs/cloudflare` `^13.1.4` |
| Deploy | Cloudflare Workers via Wrangler (`wrangler.jsonc`, worker name `lialvaro-redesign`) |
| Node engines | `>=22.12.0` |
| Package manager | npm (`package-lock.json`) |
| Local dev | `npm run dev` → `http://localhost:4321` (`host: true`) |
| Build | `npm run build` → `./dist/` |
| Preview/deploy scripts | `npm run preview` / `npm run deploy` use Wrangler (not day-to-day local) |
| Typecheck / lint / tests | No ESLint config; no automated test suite; `astro check` not wired as a script |
| Env vars | No committed `.env.example` on this baseline. Forms use Formspree (no server secrets in this branch). `.env` / `.dev.vars*` gitignored. |
| Middleware | `src/middleware.ts` — intended 301 apex → `www.lialvaro.com` and trailing slash |
| Styles | Single `src/styles/global.css` (+ large page-scoped styles in `index.astro` and components) |
| Fonts (live/layout) | Google Fonts: Manrope (layout); homepage also SF Pro Display / DM Mono links |
| Data layer | **None** yet — no `src/data/*.json` (claims/pricing/reviews/same-day). Copy is hard-coded in pages. |
| Commerce | **None** on this baseline (no Stripe, cart, API routes, D1). |

### Routes (Astro pages → URLs)

| File | URL |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/about.astro` | `/about/` |
| `src/pages/faq.astro` | `/faq/` |
| `src/pages/articles.astro` | `/articles/` |
| `src/pages/contact.astro` | `/contact/` |
| `src/pages/design-your-apparel.astro` | `/design-your-apparel/` |
| `src/pages/best-affordable-custom-t-shirt-printing-in-los-angeles-2026-local-guide.astro` | `/best-affordable-custom-t-shirt-printing-in-los-angeles-2026-local-guide/` |
| `src/pages/the-ultimate-guide-to-finding-the-perfect-place-for-your-bulk-custom-t-shirt-event-needs.astro` | `/the-ultimate-guide-to-finding-the-perfect-place-for-your-bulk-custom-t-shirt-event-needs/` |

### Components

- `Header.astro` — sticky nav, mobile menu, quote CTA
- `Footer.astro` — services/company/quick links, legal `#` stubs
- `QuoteModal.astro` — 4-step Formspree quote wizard (site-wide)
- `EmailSubscribe.astro` — email strip above footer
- `ArticleCard.astro` — articles listing card
- `Welcome.astro` — unused starter remnant (still present)
- `Layout.astro` — document shell, canonical `www`, topbar, injects Header/Footer/QuoteModal/EmailSubscribe

### Public assets

- `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt`
- `public/images/*` (hero, process photos, favicon, review stars)
- `public/brand/*` (header/footer logos)

### Deploy config (`wrangler.jsonc`)

- Worker name: `lialvaro-redesign`
- Compatibility date: `2026-03-27` (runtime may fall back; warn seen in local builds historically)
- Assets binding: `ASSETS` → `./dist`
- Flag: `global_fetch_strictly_public`
- Observability enabled

### Parallel / unmerged work (not in this baseline, not assumed live)

| PR | Branch | Notes |
|---|---|---|
| #3 | `cursor/local-dev-setup-ba6a` | AGENTS.md local-dev notes |
| #4 | `cursor/homepage-printshop-look-ba6a` | Printshop homepage, `/shop`, `/custom-printing`, Stripe, quote API |
| #5 | `cursor/fix-testimonial-typo-ba6a` | Fixes “gad” → “had” (still broken on live/this baseline) |

---

## 3. Live URL inventory

### Sitemap (`https://www.lialvaro.com/sitemap.xml`)

All `loc` values use **www** (no trailing slash in sitemap paths):

1. `/`
2. `/about`
3. `/articles`
4. `/contact`
5. `/design-your-apparel`
6. `/faq`
7. `/best-affordable-custom-t-shirt-printing-in-los-angeles-2026-local-guide`
8. `/the-ultimate-guide-to-finding-the-perfect-place-for-your-bulk-custom-t-shirt-event-needs`

`robots.txt` allows `/` and points Sitemap to `https://www.lialvaro.com/sitemap.xml`.

### Primary nav (Header)

- `/design-your-apparel`
- `/about`
- `/faq` (homepage may pass `#faq`-style faqHref locally; default `/faq`)
- `/articles`
- CTA: opens QuoteModal (`data-quote-trigger`), not a URL

### Footer links

- Services → all currently point at `/design-your-apparel` (Screen Printing, DTG, DTF, Embroidery, Same-Day Printing)
- Company → `/about`, `/articles`, `/contact`
- Quick Links → `/contact` (+ quote trigger), `/faq`, `tel:3109042655`
- Legal → `#` Privacy Policy, `#` Terms of Service (**dead links**)

### Live HTTP behavior (2026-10-21)

| Request | Result |
|---|---|
| `https://lialvaro.com/` | **200** (does **not** 301 to www) |
| `https://www.lialvaro.com/` | **200** |
| `https://lialvaro.com/about` | **307** → `/about/` then **200** |
| `https://www.lialvaro.com/about` | **307** → `/about/` then **200** |
| HTML canonical on homepage | `https://www.lialvaro.com/` |

**Defect:** Repo middleware intends apex → www 301, but production currently serves both hosts with 200. Sitemap/canonical say www.

Redirect proposal: see `docs/redirects.md`.

---

## 4. Performance / a11y / SEO baselines (live, mobile Lighthouse)

Tool: Lighthouse 12, mobile form-factor, headless Chrome, 2026-10-21.  
Evidence JSON/HTML under `docs/stage-reports/evidence/`.

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | Total bytes (LH) |
|---|---:|---:|---:|---:|---|---|---|
| `/` (home) | 94 | 95 | 96 | 92 | 2.9 s | 0 | 270 KiB |
| `/faq/` | 99 | 95 | 100 | 92 | 1.7 s | 0.001 | 75 KiB |
| `/design-your-apparel/` | 99 | 95 | 100 | 92 | 1.7 s | 0.003 | 75 KiB |

### HTML document sizes (uncompressed response body)

| URL | Bytes |
|---|---:|
| `/` | 42,121 |
| `/about/` | 34,265 |
| `/faq/` | 39,218 |
| `/contact/` | 32,201 |
| `/articles/` | 33,015 |
| `/design-your-apparel/` | 38,601 |
| article (affordable guide) | 34,545 |
| article (bulk event guide) | 34,548 |

### Core Web Vitals (field)

Lighthouse did **not** return Chrome UX Report `loadingExperience` / `originLoadingExperience` for this origin in this run. Lab LCP/CLS above are the available baseline. INP not observed in lab metrics.

---

## 5. Quote modal inventory (`QuoteModal.astro`)

**Trigger:** any `[data-quote-trigger]` (header, homepage CTAs, footer, service cards, etc.). Optional `data-quote-service` preselects Step 1.

**Submit:** `POST https://formspree.io/f/xnjoaoyw` (multipart when files present).  
Hidden: `_subject` = `New Quote Request — LiAlvaro T-Shirt Printing`, `_gotcha` honeypot, `service`.

| Step | Title | Fields | Validation notes |
|---|---|---|---|
| 1 | Select a service *(optional)* | Picker: Screen Printing, Direct to Garment, Direct to Film, Embroidery → hidden `service` | Optional; Next always available |
| 2 | What would you like to design?* | Checkboxes `quote-design-type`: Tops, Bottoms, Hats, Bags, Something Else; `colors` select (shown for Tops when applicable); `pieces` number | At least one design type; pieces required; colors required when shown |
| 3 | Blanks & design upload | Radios `quote-providing-blanks` yes/no; `blank_material` text if yes; `design_files` multi file (optional dropzone); `design_notes` textarea | Blanks yes/no required; material required if providing blanks |
| 4 | Your details | `first_name`, `last_name`, `phone`, `email` | All required; email format |
| Success | Thank-you panel | Close / Done | Replaces form UI |

Also exists: standalone design form on `/design-your-apparel` posting to the same Formspree endpoint with subject `New Project Request — LiAlvaro T-Shirt Printing`.

---

## 6. Defects & inconsistencies (verified)

| ID | Defect | Evidence |
|---|---|---|
| D1 | Canonical/sitemap use **www**, but apex `lialvaro.com` returns **200** (no host 301) | Live curl; middleware in repo not observed on prod |
| D2 | Brand name inconsistent | “LiAlvaro Apparel” (titles/about), “LiAlvaro T-Shirt Printing” / “T-shirt Printing” (footer, reviews, Formspree subject), “LTP” (review), “Lialvaro Custom Apparel” (Layout title suffix) |
| D3 | Typo in first review: **“I gad my logo”** | Live homepage + `src/pages/index.astro` (fix open as PR #5) |
| D4 | Privacy Policy / Terms of Service → `href="#"` | `Footer.astro`, live footer |
| D5 | Footer “Services” all link to `/design-your-apparel` (no distinct service URLs) | Footer markup |
| D6 | Sitemap URLs omit trailing slash; live non-root paths 307 to trailing slash | Sitemap vs live headers |
| D7 | SEO Lighthouse 92 on sampled pages (below Stage 4 bar of 95) | LH reports |
| D8 | Home lab LCP 2.9 s (Stage 4 budget wants mobile LCP &lt; 2.5 s) | LH home report |
| D9 | No `src/data/` claims/pricing/reviews registry yet | Repo layout |
| D10 | Starter `Welcome.astro` still in tree | Components list |
| D11 | README still Astro starter boilerplate | `README.md` |

### Brand name decision — **LOCKED**

**Public brand:** LiAlvaro T-Shirt Printing  
**Short chrome:** LiAlvaro (logo / nav wordmark OK)  
**Do not use going forward:** LiAlvaro Apparel, LTP, “Lialvaro Custom Apparel” title suffix (replace with brand), inconsistent “T-shirt” vs “T-Shirt” (prefer **T-Shirt**).

---

## 7. Public-language / claims notes (for later stages — not changed here)

Hard-coded claims observed on homepage/FAQ (none in `claims.json` yet):

- Same-day service / same-day printing available in LA  
- No minimums  
- 24/7 support / team available 24/7  
- Standard turnaround 5–7 business days; rush 4 days  
- Free quote  

These must be moved into `src/data/claims.json` in Stage 1 with `confirmed` flags. Stage 0 does not invent confirmations.

---

## 8. What Stage 0 does **not** include

- No UI/feature code, no styleguide, no commerce, no redirects implemented in Workers/config  
- No brand rename applied  
- No typo fix merged (tracked in PR #5)  
- No Stage 1 strategy/copy files  

---

## Gate status

- [x] Audit written (`docs/audit.md`)  
- [x] Redirect map proposed (`docs/redirects.md`)  
- [x] **Owner brand name:** LiAlvaro T-Shirt Printing  
- [x] **Owner canonical host:** www  
- [x] **Owner redirect:** `/design-your-apparel/` → `/design/` (implement when `/design/` exists)  
- [x] Stage 0 gate closed for these decisions (2026-10-21)  
