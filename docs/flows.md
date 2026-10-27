# LiAlvaro T-Shirt Printing — Stage 2 user flows

**Date:** 2026-10-21  
**Depends on:** `docs/ia.md`, Stage 1 copy/claims  
**Note:** Lanes (`local` / `pod` / `broker`) are routing labels only — never shown to customers.

---

## Flow legend

- **Oval** = start/end  
- **Box** = page or step  
- **Diamond** = decision  
- Paths use trailing-slash URLs

---

## 1. Browse → buy (standard catalog)

**Audience:** A2 (and A1 buying a listed product)  
**Happy path**

1. Land `/` or `/shop/`  
2. Optional: `/shop/[category]/` filter  
3. Open `/shop/[slug]/` (PDP) — size/color/qty  
4. Add to cart → `/cart/`  
5. Checkout (Stripe Checkout — Stage 5)  
6. `/order-confirmed/` with order id  
7. Email + later `/track/` or `/account/orders/[id]/`

```
[Start] → Home/Shop → Category? → PDP → Cart → Checkout → Order confirmed → Track
                              ↓
                         Empty catalog → Custom printing / quote
```

**Decisions**

| If | Then |
|---|---|
| Catalog empty | Show empty state + CTA Get a custom quote |
| Item not same-day eligible / POD | Never show same-day promise |
| Item local + ZIP + before cutoff | Cart may offer same-day *request* (see flow 6) |

**Errors / exits:** Out of stock → Unavailable; abandon cart → return via cart link; checkout fail → stay in Stripe/error + call fallback.

---

## 2. Design → buy

**Audience:** A2  
**Happy path**

1. `/` hero **Start Designing** or nav Design Studio → `/design/`  
2. Choose product / color / side  
3. Upload art and/or add text; edit layers  
4. Preflight warnings (DPI, size, transparency) — warn, don’t silently fail  
5. IP attestation checkbox required  
6. Export print-ready file (server validates)  
7. Continue to checkout (design attached to cart line)  
8. `/order-confirmed/` → track / save design on login

```
[Start] → Design Studio → Edit → Preflight OK? → Attest IP → Export → Checkout → Confirmed
                              ↓ no
                         Fix file / continue with warning (policy TBD Stage 6)
```

**Guest:** Cookie session holds design; on magic-link login, attach to account (Stage 7).  
**Exit:** Call phone claim if export fails repeatedly.

---

## 3. Request quote (custom / bulk / specialty)

**Audience:** A1, A3  
**Entry points:** Header/footer Get a quote · `/?quote=1` (legacy `/custom-printing/` 301) · homepage secondary CTA · method cards

**Happy path (aligns with current modal + Stage 8 rebuild)**

1. Open quote modal (no `/custom-printing/` page — owner lock) 
2. Step 1 — Service (optional): Screen / DTG / DTF / Embroidery  
3. Step 2 — Design types, colors (when shown), piece count  
4. Step 3 — Providing blanks? · material · file upload · notes  
5. Step 4 — Name, phone, email → submit  
6. Success state — expect `[claim:quote-response-1-business-hour]`  
7. Owner follows up (email/phone); later Stage 8: admin quote → Stripe payment link

```
[Start] → Quote entry → S1 service → S2 product needs → S3 blanks/files → S4 contact → Success
                                                                    ↓ fail
                                                              Error + call phone
```

**Analytics (scaffold Stage 4):** `quote_started`, `quote_step_N`, `quote_submitted`.

---

## 4. Reorder

**Audience:** Returning customer (Stage 7)  
**Happy path**

1. Magic-link sign-in → `/account/`  
2. `/account/orders/` → select past order  
3. One-click reorder eligible lines → cart prefilled  
4. Checkout → confirmed

```
[Start] → Sign in → Orders → Reorder → Cart → Checkout → Confirmed
```

**If design missing / SKU retired:** Prompt Design Studio or quote instead of silent failure.

---

## 5. Client store purchase

**Audience:** Org members buying from `/stores/[client-slug]/`  
**Happy path**

1. Open store URL (public or unlisted link)  
2. Browse store’s product selection (optional per-store markup — internal)  
3. Add to cart (cart still global storefront cart with store context on line items)  
4. Checkout → confirmed  
5. Optional LA pickup note when eligible (Stage 7 rules)

```
[Start] → Client store → PDP-in-store → Cart → Checkout → Confirmed
```

**Unlisted store:** Noindex; not linked from main nav.  
**Exit:** Store disabled → friendly unavailable + link to main shop/quote.

---

## 6. Same-day inquiry

**Audience:** A1 with deadline  
**Public rule:** Advertise only approved claim text. Never imply in-house / facility. POD never same-day.

**Path A — Eligible local item in cart (Stage 5)**

1. Customer has eligible `local` product(s)  
2. Shipping ZIP in `same-day.json` allowlist  
3. Before cutoff time (**11:00** America/Los_Angeles)  
4. Total pieces **≤ 12** (`max_pieces` in `same-day.json`)  
5. Cart offers **same-day request** (not a silent guarantee)  
5. If unsure → “Call to confirm” with phone claim  
6. Order flagged `rush_local` for admin queue

**Path B — Not in cart / unsure**

1. See claim on home/FAQ/custom-printing: *Same-day printing available for select orders in Los Angeles. Call to confirm.*  
2. Call **or** quote form with deadline in notes  
3. Owner confirms eligibility offline / later admin tools

```
[Start] → Sees same-day claim → Eligible cart path? → Request same-day → Checkout / admin queue
                    ↓ no / unsure
                 Call or quote (notes = deadline)
```

---

## 7. Cross-flow navigation (happy exits)

| From | Can go to |
|---|---|
| Shop empty / custom need | Quote flow |
| Design too complex | Quote / call |
| Quote for simple tee | Soft suggest Design or Shop |
| Any error | Phone `[claim:phone-310-904-2655]` |

---

## Gate notes

Flows are structural contracts for Stages 4–8. Owner approves that these six flows match the business; pixel UI comes in later stages.
