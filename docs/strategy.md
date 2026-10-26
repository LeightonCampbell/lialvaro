# LiAlvaro T-Shirt Printing — Stage 1 strategy

**Brand (locked):** LiAlvaro T-Shirt Printing  
**Canonical:** `https://www.lialvaro.com`  
**Date:** 2026-10-21  
**Depends on:** Stage 0 audit + owner gate decisions  

Claims used in messaging must exist in `src/data/claims.json` with `"confirmed": true` before they appear on production pages. Until then, treat claim-backed lines in the copy deck as **draft pending owner confirmation**.

---

## 1. Understanding (Stage Protocol)

1. Stage 1 locks *who we talk to* and *what we say* before wireframes or pixels.
2. Deliverables are strategy, copy deck, and a claims register — not pages or design.
3. Brand string is **LiAlvaro T-Shirt Printing**; short chrome may say **LiAlvaro**.
4. Same-day may be advertised only with the approved public wording; never imply in-house production or name POD vendors.
5. Reviews in copy must be real (from the current site); no invented stats, prices, or scarcity.

### Assumptions

- Three fulfilment lanes (local / pod / broker) stay internal; customers see one storefront.
- Primary paths: Design Studio (`/design/` — order-ready), Store (`/shop/`), quote modal for non-studio work.
- `/design-your-apparel/` 301 → `/design/`; `/custom-printing/` removed (301 → `/?quote=1`). See `docs/OWNER_LOCKS.md`.
- Phone `(310) 904-2655` and `help@lialvaro.com` remain the public contacts once confirmed in `claims.json`.
- No Google review count or rating average is published until the owner supplies a verifiable source.

### Non-blocking questions (owner can answer with Stage 1 gate)

1. Confirm or edit each row in `src/data/claims.json` (`confirmed: true|false` + rewrite `text` if needed).
2. Approve homepage messaging hierarchy and audience priorities in this doc.
3. Approve copy deck tone (direct, practical, LA print shop — not luxury fashion).
4. Optional: provide a public Google reviews URL / exact star count if you want proof stats later.
5. Optional: confirm whether “premier” / superlatives should stay out of new copy (recommended: avoid).

---

## 2. Audience profiles

### A1 — Local need-it-done customers

**Who:** LA-area individuals, teams, churches, schools, small orgs who need apparel or print for an event, fundraiser, or brand refresh — often with a deadline.

**Jobs to be done:**
1. Get a clear price/path fast (call or quote).
2. Know if same-day or rush is even possible for their order.
3. Hand off art (or get help) without a confusing process.
4. Trust a real person will answer.

**Primary CTA:** Get a free quote / Call  
**Secondary:** See print methods (Custom Printing)

**Success looks like:** They call or submit a quote the same visit; they are not asked to learn POD jargon.

---

### A2 — Self-serve designers & buyers

**Who:** Anyone (local or remote) who wants to design a shirt (or simple apparel) online and buy without a sales call.

**Jobs to be done:**
1. Start a design on phone or desktop quickly.
2. See price before commitment.
3. Checkout with confidence (tracking later).
4. Reorder the same design later (account — later stage).

**Primary CTA:** Start Designing  
 
**Secondary:** Shop standard products

**Success looks like:** Design started → export → cart; quote modal is *not* the default path for them.

---

### A3 — Broader business / specialty print buyers

**Who:** Businesses and organizers who need more than a basic tee — mixed garments, larger runs, specialty items, banners/promo, or work that needs a custom quote and project management.

**Jobs to be done:**
1. Explain the project once (garment, qty, method, files, timing).
2. Get a written quote they can approve.
3. Stay updated through production/delivery without chasing.
4. Use LiAlvaro as an ongoing vendor.

**Primary CTA:** Request a custom quote  
**Secondary:** Call for complex jobs

**Success looks like:** Structured quote request completed; they feel the process is for “real jobs,” not only one-off tees.

---

## 3. Homepage messaging hierarchy

**One idea for the page:** Two clear paths — *design & buy* or *get a quote* — backed by real customer proof and plain-spoken service.

| Layer | Message | Notes |
|---|---|---|
| **Brand** | LiAlvaro T-Shirt Printing | Hero-level, not only nav |
| **Headline** | Custom printed apparel. Clear process. Los Angeles. | Avoid “premier” / unverified superlatives |
| **Subhead** | Design online and checkout, or request a quote for custom and bulk work. Same-day printing available for select orders in Los Angeles — call to confirm. | Same-day line only if claim `same-day-printing` is confirmed; otherwise drop the same-day sentence |
| **Proof** | Real customer quotes (Leighton C., Mark L., Richard L., etc.) — no star-count inventing | Fix known typo “gad”→“had” when publishing; do not invent “LTP” expansion in the quote |
| **Primary commercial CTA (hero)** | Start Designing → `/design/` | Owner lock 2026-10-26 |
| **Secondary CTA (hero)** | Get a free quote → custom printing / quote flow | Aligns with A1/A3; only if `free-quote` confirmed |

### Section order & one primary CTA each

| Section | Purpose | Primary CTA |
|---|---|---|
| Hero | Brand + H1 “Fast, Easy, High-Quality…” | Start Designing |
| How it works (3 steps) | Reduce anxiety | Start your design **or** Get a quote (pick one primary in build; secondary text link) |
| Featured products | Shop path | Shop products |
| Print methods | Educate A1/A3 | Get a custom quote |
| Reviews | Proof | (none — or text link to more reviews if URL confirmed) |
| Short FAQ | Objections | View FAQ |
| Final CTA band | Convert undecided | Get a free quote **or** Call |

No stats strip with invented numbers. No “only 3 left” / countdown urgency.

---

## 4. Voice guide

**Personality:** Practical, warm, direct. A real LA print partner — not a faceless marketplace, not a luxury lookbook.

| Do | Don’t |
|---|---|
| Short sentences. Plain words (“quote”, “turnaround”, “upload your art”). | Hype: “revolutionary”, “disrupt”, “#1 in LA” without proof |
| “We” / “our team” | “In-house”, “our presses”, “our facility”, “shop floor”, “artisans”, POD vendor names |
| Invite a call for edge cases | Fake scarcity, fake timers, pre-checked upsells |
| Specific next step in every CTA | Multiple competing CTAs in one section |
| Use customer words from real reviews | Invent testimonials or ratings |

**Capitalization:** Brand = **LiAlvaro T-Shirt Printing** (T-Shirt capitalized). Product UI may say “t-shirt” generically.

**Accessibility of language:** Avoid slang that obscures meaning; keep reading level approachable.

---

## 5. Claims register

Source of truth: `src/data/claims.json`.  

All entries ship with `"confirmed": false`. **Stage 1 gate:** owner flips each claim to `true` or edits/deletes it.

Minimum set included: same-day (approved wording), no minimums, free quote, 24/7 support, 1-business-hour quote response, standard/rush turnaround, LA delivery, phone, email, print methods, Los Angeles location.

---

## 6. Channel notes (for later stages — not building now)

- SEO titles/descriptions should lead with **LiAlvaro T-Shirt Printing** + Los Angeles + task keywords.
- Paid/social creative should use the same two-path story (Design vs Quote).
- Emails later: from brand domain; never mention POD vendors.

---

## Gate

Owner approves this strategy (audiences + hierarchy + voice) and processes `claims.json`. Copy deck is in `docs/copy-deck.md`.
