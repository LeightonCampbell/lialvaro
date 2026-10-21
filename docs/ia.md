# LiAlvaro T-Shirt Printing — Stage 2 information architecture

**Brand (locked):** LiAlvaro T-Shirt Printing  
**Canonical:** `https://www.lialvaro.com`  
**Date:** 2026-10-21  
**Depends on:** Stage 0 audit/redirects, Stage 1 strategy + copy + claims  
**Status:** Draft for owner wireframe gate (structure only — no visual design system)

---

## 1. Understanding (Stage Protocol)

1. Stage 2 locks *structure* — sitemap, flows, and low-fi wireframes — before styleguide or real pages.
2. Customers see one storefront; `local` / `pod` / `broker` lanes stay internal.
3. Two commercial paths stay primary: **Design a shirt** (`/design/`) and **Get a quote** (`/custom-printing/` + quote modal).
4. Existing keep-pages (`/about/`, `/faq/`, `/articles/`, `/contact/`, article URLs) remain; `/design-your-apparel/` 301s → `/design/` when Design ships.
5. Wireframes are layout boxes only (no brand styling); owner reviews screenshots, not code.

### Assumptions

- Trailing-slash URLs on all non-file paths (matches Stage 0 redirect map).
- Nav labels from copy deck: Shop · Design · Custom Printing · About · FAQ; primary chrome CTA Shop; secondary Get a quote.
- Account and admin exist in the sitemap but ship in later stages; wireframes cover overview shells only.
- Client stores are public or unlisted under `/stores/[client-slug]/` (Stage 7).
- Same-day is not a standalone marketing page; eligibility surfaces on eligible PDP/cart and via call/quote (BUILD_PLAN public wording).

### Non-blocking questions (answer with Stage 2 gate)

1. Approve section order on the homepage wireframe (hero → how it works → featured → methods → reviews → FAQ → final CTA).
2. Confirm Shop nav is acceptable as the header primary button (copy deck) vs Design (hero primary) — both kept; chrome vs hero roles differ.
3. Prefer quote entry as page `/custom-printing/` *and* global modal (recommended) vs page-only.
4. Account: magic-link later — is an early “Sign in” nav item OK as a placeholder shell, or hide until Stage 7?
5. Optional: public `/same-day/` landing — **not** proposed (keeps same-day as claim + eligibility UX only).

---

## 2. Sitemap

Legend: **Keep** = live today · **New** = planned · **Redirect** = Stage 0 owner-approved · **Later** = shell only in Stage 2 · **Internal** = not customer-facing

### 2.1 Public marketing & content

| Path | Role | Status |
|---|---|---|
| `/` | Homepage — two paths + proof | Keep → rebuild Stage 4 |
| `/about/` | Brand story | Keep |
| `/faq/` | Objections / claims FAQ | Keep |
| `/articles/` | Article index | Keep |
| `/contact/` | Contact + phone/email | Keep |
| `/best-affordable-custom-t-shirt-printing-in-los-angeles-2026-local-guide/` | Article | Keep |
| `/the-ultimate-guide-to-finding-the-perfect-place-for-your-bulk-custom-t-shirt-event-needs/` | Article | Keep |
| `/privacy/` | Privacy Policy | New (Stage 4 scaffold) |
| `/terms/` | Terms of Service | New (Stage 4 scaffold) |

### 2.2 Commerce & design

| Path | Role | Status |
|---|---|---|
| `/shop/` | Catalog index | New (Stage 5) |
| `/shop/[category]/` | Category listing | New (Stage 5) |
| `/shop/[slug]/` | Product detail (PDP) | New (Stage 5) |
| `/design/` | Design Studio | New (Stage 6); **301 target** for legacy design URL |
| `/design-your-apparel/` | Legacy design intake | Keep until cutover → **301 → `/design/`** |
| `/custom-printing/` | Custom / bulk + quote entry | New (Stage 4 shell / Stage 8 quote rebuild) |
| `/cart/` | Cart | New (Stage 5) |
| `/order-confirmed/` | Post-checkout confirmation | New (Stage 5) |
| `/track/` | Order tracking (carrier + our status) | New (Stage 5) |
| `/stores/[client-slug]/` | Client storefront | New (Stage 7) |

### 2.3 Account & admin

| Path | Role | Status |
|---|---|---|
| `/account/` | Account home | Later (Stage 7) |
| `/account/orders/` | Order history | Later |
| `/account/orders/[id]/` | Order detail + track link | Later |
| `/account/designs/` | Saved designs | Later |
| `/account/addresses/` | Addresses | Later |
| `/account/artwork/` | Artwork library | Later |
| `/admin/` | Owner dashboard | Later (Stage 7; Access / role) |
| `/admin/orders/` | Orders by lane | Later |
| `/admin/needs-attention/` | Failure queue | Later |
| `/admin/same-day/` | Rush / same-day queue | Later |
| `/admin/products/` | Catalog editor | Later |
| `/admin/stores/` | Client stores editor | Later |
| `/admin/quotes/` | Broker quote builder | Later (Stage 8) |

### 2.4 System / preview

| Path | Role | Status |
|---|---|---|
| `/sitemap.xml` | SEO sitemap | Keep; refresh locs Stage 4 |
| `/robots.txt` | Crawlers | Keep; disallow preview/admin |
| `/_preview/wireframes/` | Stage 2 low-fi wireframes | **This stage** — `noindex,nofollow` |
| `/_styleguide/` | Living styleguide | Stage 3 |

### 2.5 Explicitly out of sitemap (not proposed)

- No public `/same-day/` page
- No POD vendor URLs or named provider pages
- No lane-named URLs (`/local`, `/pod`, `/broker`)

---

## 3. Navigation model

### Global header

| Slot | Content |
|---|---|
| Brand | LiAlvaro → `/` |
| Primary links | Shop · Design · Custom Printing · About · FAQ |
| Utility | Cart (count) · Sign in *(placeholder until Stage 7)* |
| Primary button | Shop now → `/shop/` |
| Secondary | Get a quote → opens quote modal *or* `/custom-printing/` |

Mobile: hamburger → same links; quote + call sticky or in drawer.

### Footer

| Column | Links |
|---|---|
| Brand | Tagline; phone; email |
| Shop | `/shop/`, featured categories (when live) |
| Services | Screen / DTG / DTF / Embroidery → `/custom-printing/` (not all → design URL) |
| Company | About, FAQ, Articles, Contact |
| Legal | Privacy, Terms (real routes) |

---

## 4. Homepage information hierarchy

Aligned with Stage 1 strategy + BUILD_PLAN Stage 2 homepage structure. **One primary CTA per section.**

| # | Section | Content slots | Primary CTA |
|---|---|---|---|
| 1 | Hero | Brand (hero-level) · headline · short subhead · CTA group · dominant full-bleed visual plane | Design a shirt → `/design/` |
| 2 | How it works | H2 · 3 steps | Start your design → `/design/` (text link: Get a quote) |
| 3 | Featured products | H2 · 3–4 product cards · empty state if no catalog | Shop products → `/shop/` |
| 4 | Print methods | H2 · 4 method slots (names only; no production-floor imagery captions) | Get a custom quote → `/custom-printing/` |
| 5 | Reviews | H2 · real quotes only · no invented star count | *(none)* |
| 6 | Short FAQ | 3–4 Q&As from copy deck | View FAQ → `/faq/` |
| 7 | Final CTA band | H2 · body · CTA group | Get a free quote |
| — | Footer | As above | — |

Hero secondary: Get a free quote. Tertiary: Call (claim-confirmed phone).

---

## 5. Page → audience map (primary)

| Path | A1 Local / deadline | A2 Self-serve design | A3 Specialty / bulk |
|---|---|---|---|
| `/` | Quote / call | Design | Quote |
| `/shop/*` | Browse standards | Buy blanks/standards | Secondary |
| `/design/` | Secondary | **Primary** | Secondary |
| `/custom-printing/` | **Primary** | Secondary | **Primary** |
| `/stores/[slug]/` | Org buyers | — | Client programs |
| `/track/`, `/account/*` | Post-purchase | Post-purchase | Post-purchase |

---

## 6. Redirect & link rules (IA-facing)

From Stage 0 `docs/redirects.md` (do not implement until destinations exist):

| Rule | Action |
|---|---|
| Apex → www | 301 |
| Trailing slash | 301 preferred |
| `/design-your-apparel/` → `/design/` | 301 at Design cutover |
| Footer Services | Point to `/custom-printing/` (and anchors later), not only design URL |
| Privacy / Terms | Real pages; never `#` |

---

## 7. Deliverables cross-check

| BUILD_PLAN Stage 2 item | Location |
|---|---|
| Sitemap | This file §2 |
| User flows | `docs/flows.md` |
| Low-fi wireframes | `/_preview/wireframes/*` |
| Screenshots | `docs/stage-reports/evidence/wireframes/` |

---

## Gate

Owner approves sitemap + homepage section order (together with wireframe screenshots). No production IA changes ship in Stage 2.
