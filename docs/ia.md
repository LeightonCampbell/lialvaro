# LiAlvaro T-Shirt Printing — Stage 2 information architecture

**Brand (locked):** LiAlvaro T-Shirt Printing  
**Canonical:** `https://www.lialvaro.com`  
**Date:** 2026-10-21  
**Depends on:** Stage 0 audit/redirects, Stage 1 strategy + copy + claims  
**Status:** Superseded in part by owner locks 2026-10-26 — see `docs/OWNER_LOCKS.md` (nav, hero, Design Studio vs quote, `/custom-printing/` removed).

---

## 1. Understanding (Stage Protocol)

1. Stage 2 locks *structure* — sitemap, flows, and low-fi wireframes — before styleguide or real pages.
2. Customers see one storefront; `local` / `pod` / `broker` lanes stay internal.
3. Two commercial paths stay primary: **Design Studio** (`/design/` — order-ready) and **Get a quote** (**quote modal only**).
4. Existing keep-pages (`/about/`, `/faq/`, `/articles/`, `/contact/`, article URLs) remain; `/design-your-apparel/` 301s → `/design/`; `/custom-printing/` 301s → `/?quote=1`.
5. Wireframes are layout boxes only (no brand styling); owner reviews screenshots, not code.

### Assumptions

- Trailing-slash URLs on all non-file paths (matches Stage 0 redirect map).
- **Locked nav:** Services · Store · Design Studio · FAQs; chrome CTA **Get a quote**; Cart + Sign in in top bar (see `OWNER_LOCKS.md`).
- Account and admin exist in the sitemap but ship in later stages; wireframes cover overview shells only.
- Client stores are public or unlisted under `/stores/[client-slug]/` (Stage 7).
- Same-day is not a standalone marketing page; eligibility surfaces on eligible PDP/cart and via call/quote (BUILD_PLAN public wording).

### Owner-resolved (2026-10-26)

1. Homepage section order kept (hero → how it works → store → services → reviews → FAQ → final CTA).
2. Header primary CTA is **Get a quote** (not Shop now).
3. Quote entry is **modal only** — no `/custom-printing/` page.
4. Sign in + Cart live in the **top bar** (right), not main header.
5. No public `/same-day/` landing.

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
| `/design/` | Design Studio (order-ready) | Live foundation; canvas Stage 6; **301 target** for legacy design URL |
| `/design-your-apparel/` | Legacy design intake | **301 → `/design/`** |
| `/custom-printing/` | *(removed)* | **301 → `/?quote=1`** — quote modal only (owner lock) |
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

### Top bar

| Slot | Content |
|---|---|
| Left | Same-day + phone announcement (left-aligned) |
| Right | Cart · Sign in |

### Global header

| Slot | Content |
|---|---|
| Brand | LiAlvaro → `/` |
| Primary links | Services (`/#services`) · Store (`/shop/`) · Design Studio (`/design/`) · FAQs (`/faq/`) |
| Primary button | Get a quote → opens quote modal |

Mobile: hamburger → same links + Get a quote.

### Footer

| Column | Links |
|---|---|
| Brand | Tagline; phone; email |
| Shop | Store `/shop/`, Design Studio `/design/` |
| Services | Screen / DTG / DTF / Embroidery → **quote modal** (preselected service) |
| Company | About, FAQs, Articles, Contact |
| Legal | Privacy, Terms (real routes) |

---

## 4. Homepage information hierarchy

Aligned with Stage 1 strategy + BUILD_PLAN Stage 2 homepage structure. **One primary CTA per section.**

| # | Section | Content slots | Primary CTA |
|---|---|---|---|
| 1 | Hero | Brand (eyebrow) · **H1: Fast, Easy, High-Quality** / **Custom Apparel Printing** (break after Quality) · short subhead · CTA group · dominant visual | **Start Designing** → `/design/` |
| 2 | How it works | H2 · 3 steps | Start Designing → `/design/` (text: Get a quote) |
| 3 | Featured products | H2 · 3–4 product cards · empty state if no catalog | Browse the store → `/shop/` |
| 4 | Services | H2 · 4 method slots → quote modal with service | Get a custom quote → modal |
| 5 | Reviews | H2 · real quotes only · no invented star count | *(none)* |
| 6 | Short FAQ | 3–4 Q&As from copy deck | View FAQ → `/faq/` |
| 7 | Final CTA band | H2 · body · CTA group | Get a free quote |
| — | Footer | As above | — |

Hero secondary: Get a free quote. Phone **not** in hero CTA group (owner lock).

---

## 5. Page → audience map (primary)

| Path | A1 Local / deadline | A2 Self-serve design | A3 Specialty / bulk |
|---|---|---|---|
| `/` | Quote / call | Design | Quote |
| `/shop/*` | Browse standards | Buy blanks/standards | Secondary |
| `/design/` | Secondary | **Primary** (order-ready) | Secondary |
| Quote modal | **Primary** | Secondary | **Primary** |
| `/stores/[slug]/` | Org buyers | — | Client programs |
| `/track/`, `/account/*` | Post-purchase | Post-purchase | Post-purchase |

---

## 6. Redirect & link rules (IA-facing)

From Stage 0 `docs/redirects.md` (do not implement until destinations exist):

| Rule | Action |
|---|---|
| Apex → www | 301 |
| Trailing slash | 301 preferred |
| `/design-your-apparel/` → `/design/` | 301 (implemented) |
| `/custom-printing/` → `/?quote=1` | 301 (owner lock) |
| Footer Services | Open quote modal with service preselected |
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
