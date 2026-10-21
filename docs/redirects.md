# LiAlvaro redirect map (proposed)

**Status:** Proposal only — Stage 0. Do not implement until Stage 4 (or owner explicitly asks).  
**Canonical host (recommended):** `https://www.lialvaro.com`  
**URL style (recommended):** trailing slash on all non-file paths (matches live 307 behavior and Astro `Layout` canonical normalization).

---

## 1. Keep (no content change required)

These must continue to resolve (200 or 301→canonical form):

| Path | Notes |
|---|---|
| `/` | Homepage |
| `/design-your-apparel/` | Keep (plan Stage 0 / Stage 4 port) |
| `/about/` | Keep |
| `/faq/` | Keep |
| `/articles/` | Keep |
| `/contact/` | Keep |
| `/best-affordable-custom-t-shirt-printing-in-los-angeles-2026-local-guide/` | Article |
| `/the-ultimate-guide-to-finding-the-perfect-place-for-your-bulk-custom-t-shirt-event-needs/` | Article |
| `/sitemap.xml` | Keep; update locs to trailing-slash www forms |
| `/robots.txt` | Keep |

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

## 5. Future IA (Stage 2+) — planned redirects when routes ship

Only apply once the new page exists and owner approves IA. Tentative map:

| Legacy / interim | Future | Code | Notes |
|---|---|---|---|
| `/design-your-apparel/` | `/design/` **or** keep forever | TBD | Owner must choose: permanent keep vs 301 to Design Studio |
| Homepage service CTAs / footer service links → `/design-your-apparel/` | `/custom-printing/` (quote) and/or `/shop/` | 301 or link update | Unmerged PR #4 already explores `/shop` + `/custom-printing` |
| *(none today)* | `/shop/`, `/cart/`, `/track/`, `/stores/[slug]/`, `/account/*`, `/admin/*` | n/a | New; no legacy |

**Do not remove** `/design-your-apparel/` without an explicit owner decision and a 301.

---

## 6. Fragment / in-page targets

| From | Behavior |
|---|---|
| `/#faq` or `/faq#…` | Prefer dedicated `/faq/`; homepage FAQ section may remain as `#faq` for deep links |
| Quote modal | Not a URL — keep JS trigger; Stage 8 also exposes `/custom-printing/` |

---

## 7. Implementation notes (for Stage 4, not now)

1. Prefer **one** enforcement layer: Astro middleware *and* Cloudflare Redirect Rule should not fight; pick primary.
2. Skip host/slash redirects for webhook/API paths when those appear (`/api/*`) — already a concern in unmerged Stripe work.
3. After deploy: verify with `curl -sSIL` that apex → www is 301 and that every sitemap URL returns 200 on the canonical form.
4. Update `public/sitemap.xml` locs to match chosen host + slash policy.

---

## 8. Owner decisions needed

1. Canonical host: **www** (recommended) vs apex.  
2. Keep `/design-your-apparel/` permanently, or eventually 301 → `/design/`?  
3. Approve converting live **307** slash redirects to **301**.  
