# Owner locks (do not undo)

**Status:** Locked by owner 2026-10-26.  
**Rule:** Later stages (5–9) and agents must **not** revert these decisions. If a stage deliverable conflicts with this file, update the stage to match these locks — do not restore removed routes or old nav/copy.

---

## Commercial paths

1. **Design Studio (`/design/`)** is the **order-ready** path: choose product → design → checkout (canvas in Stage 6). Customers on this path are ready to order, not requesting a broker quote.
2. **Quote modal** (global `data-quote-trigger`) is the **only** entry for custom / bulk / specialty / method-led inquiries that are **not** started in Design Studio.
3. **`/custom-printing/` is removed.** Do not recreate the page. **301** `/custom-printing` and `/custom-printing/` → `/?quote=1` (opens quote modal). Stage 8 quote rebuild is **modal (+ admin) only** — no dedicated public quote page.

---

## Fulfillment & Store (locked 2026-10-26)

1. **LiAlvaro fulfills print-on-demand itself.** Do **not** integrate Printful, Printify, or any named POD vendor for store fulfillment. Never name POD platforms in customer-facing copy.
2. **Store (`/shop/`)** lists **designs from LiAlvaro’s vendors** (artists/partners). Customers buy those designs on apparel blanks.
3. After an order is paid, it enters the **owner production queue** (`local` lane). When the order is fulfilled, the **vendor cut** for each design line is owed and tracked for payout — LiAlvaro pays vendors their cut; vendors do not fulfill.
4. BUILD_PLAN Stage 5 “Implement Printful” / provider sync is **struck** and replaced by: vendor + design catalog, local production queue, vendor_cut accounting.

---

## Global chrome

| Slot | Locked value |
|---|---|
| Primary nav | **Services** (`/#services`) · **Store** (`/shop/`) · **Design Studio** (`/design/`) · **FAQs** (`/faq/`) |
| Nav CTA button | **Get a quote** (opens quote modal) — only primary chrome CTA |
| Top bar left | Same-day + phone announcement (left-aligned) |
| Top bar right | **Cart** · **Sign in** |
| Header | No Cart / Sign in / “Shop now” button in the main header |

---

## Homepage hero

| Slot | Locked value |
|---|---|
| Brand signal | **LiAlvaro** (eyebrow / brand line — keep hero-level brand presence) |
| H1 | **Fast, Easy, High-Quality Custom Apparel Printing** |
| Primary CTA | **Start Designing** → `/design/` |
| Secondary CTA | **Get a free quote** → quote modal |
| Phone in hero CTA group | **Removed** (phone stays in top bar / footer / final CTA as needed) |

---

## Naming

- Page and nav label: **Design Studio** (not “Design” alone in nav).
- Store nav label: **Store** (route remains `/shop/`).
- FAQ nav label: **FAQs** (route remains `/faq/`).

---

## Stage overrides (BUILD_PLAN)

| Stage item | Override |
|---|---|
| Stage 2 sitemap `/custom-printing` | **Struck** — redirect only |
| Stage 4 “Custom Printing” page | **Struck** — quote modal only |
| Stage 8 “on `/custom-printing` and as a modal” | **Modal (+ D1/admin) only** |
| Stage 6 Design Studio | Build canvas on `/design/`; preserve order-ready framing and nav locks |
| Copy deck / IA older “Design a shirt” hero CTA | Superseded by **Start Designing** + locked H1 |
| Stage 5 Printful / external POD provider | **Struck** — owner-fulfilled POD + vendor designs + vendor cuts |
| Stage 5 “POD items never same-day” | Only if a future external lane exists; **store designs are local** and may use same-day rules when eligible |
