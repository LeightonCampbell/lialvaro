# LiAlvaro redirect map (proposed)

**Status:** Stage 4 + owner locks (2026-10-26). Host + trailing-slash + `/design-your-apparel/` → `/design/` + `/custom-printing/` → `/?quote=1` enforced in `src/middleware.ts`. See `docs/OWNER_LOCKS.md`.  
**Canonical host (locked):** `https://www.lialvaro.com`  
**URL style (recommended):** trailing slash on all non-file paths (matches live 307 behavior and Astro `Layout` canonical normalization).

---

## 1. Keep (no content change required)

These must continue to resolve (200 or 301→canonical form):

| Path | Notes |
|---|---|
| `/` | Homepage |
| `/about/` | Keep |
| `/faq/` | Keep |
| `/articles/` | Keep |
| `/contact/` | Keep |
| `/best-affordable-custom-t-shirt-printing-in-los-angeles-2026-local-guide/` | Article |
| `/the-ultimate-guide-to-finding-the-perfect-place-for-your-bulk-custom-t-shirt-event-needs/` | Article |
| `/sitemap.xml` | Keep; update locs to trailing-slash www forms |
| `/robots.txt` | Keep |

`/design-your-apparel/` is **not** a permanent keep — see §5 (owner-approved 301 → `/design/`).

---

## 2. Host redirects

| From | To | Code | Notes |
|---|---|---|---|
| `https://lialvaro.com/*` | `https://www.lialvaro.com/*` | **301** | **Broken today** — apex returns 200. Repo middleware already intends this; production must enforce it (Workers middleware and/or Cloudflare Redirect Rules). |
| `http://*` | `https://www.lialvaro.com/*` | 301 | Confirm CF SSL/edge handles this |

---

## 3. Trailing-slash normalization

| From | To | Code |
|---|---|---|
| `/about` | `/about/` | 301 (live currently uses **307** — prefer **301** for SEO permanence) |
| `/faq` | `/faq/` | 301 |
| `/articles` | `/articles/` | 301 |
| `/contact` | `/contact/` | 301 |
| `/design-your-apparel` | `/design-your-apparel/` | 301 |
| `/best-affordable-…` (no slash) | same + `/` | 301 |
| `/the-ultimate-guide-…` (no slash) | same + `/` | 301 |

Sitemap `loc` values should be updated to the **www + trailing slash** form so they match canonical tags.

---

## 4. Dead / stub links to replace (not redirects — new pages later)

| Current | Proposed destination | When |
|---|---|---|
| Footer `Privacy Policy` → `#` | `/privacy/` (scaffold Stage 4) | Stage 4 |
| Footer `Terms of Service` → `#` | `/terms/` (scaffold Stage 4) | Stage 4 |

Until those pages exist, do **not** 301 `#` anywhere; implement real routes.

---

## 5. Future IA — owner-approved redirects when routes ship

Apply only once the destination page exists (Stage 4/6 for Design Studio).

| Legacy / interim | Future | Code | Status |
|---|---|---|---|
| `/design-your-apparel` | `https://www.lialvaro.com/design/` | **301** | **Implemented** (middleware) |
| `/design-your-apparel/` | `https://www.lialvaro.com/design/` | **301** | **Implemented** (middleware) |
| `/custom-printing` | `https://www.lialvaro.com/?quote=1` | **301** | **Implemented** — opens quote modal (owner lock) |
| `/custom-printing/` | `https://www.lialvaro.com/?quote=1` | **301** | **Implemented** — opens quote modal (owner lock) |
| Homepage / footer service links | Quote modal (`data-quote-trigger`) | n/a | **Implemented** — do not recreate `/custom-printing/` |
| *(none today)* | `/shop/`, `/cart/`, `/track/`, `/stores/[slug]/`, `/account/*`, `/admin/*` | n/a | New; no legacy |

---

## 6. Fragment / in-page targets

| From | Behavior |
|---|---|
| `/#faq` or `/faq#…` | Prefer dedicated `/faq/`; homepage FAQ section may remain as `#faq` for deep links |
| Quote modal | Not a URL — keep JS trigger; `/?quote=1` auto-opens; Stage 8 rebuilds modal (+ admin) only — **no** `/custom-printing/` page |

---

## 7. Implementation notes (for Stage 4, not now)

1. Prefer **one** enforcement layer: Astro middleware *and* Cloudflare Redirect Rule should not fight; pick primary.
2. Skip host/slash redirects for webhook/API paths when those appear (`/api/*`) — already a concern in unmerged Stripe work.
3. After deploy: verify with `curl -sSIL` that apex → www is 301 and that every sitemap URL returns 200 on the canonical form.
4. Update `public/sitemap.xml` locs to match chosen host + slash policy.

---

## 8. Owner decisions

| Topic | Decision | Date |
|---|---|---|
| Canonical host | **www.lialvaro.com** | 2026-10-21 |
| `/design-your-apparel/` | **301 → `/design/`** | 2026-10-21 |
| `/custom-printing/` | **Removed; 301 → `/?quote=1`** | 2026-10-26 |
| Convert live **307** slash redirects to **301** | Still recommended; not explicitly confirmed | Pending |

Brand for titles/copy: **LiAlvaro T-Shirt Printing** (see `docs/audit.md`).