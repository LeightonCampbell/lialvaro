# LiAlvaro T-Shirt Printing — Stage 1 copy deck

**Brand:** LiAlvaro T-Shirt Printing  
**Date:** 2026-10-21  
**Rule:** Lines tagged `[claim:id]` must not ship until that id is `"confirmed": true` in `src/data/claims.json`. Untagged lines are structural/UI copy safe to use with brand/contact once those claims are confirmed.

**Reviews:** Verbatim from the current homepage unless noted. Typo fix: “gad” → “had” (owner-requested). Do not invent new testimonials.

---

## Global chrome

| Slot | Copy |
|---|---|
| Logo / aria home | LiAlvaro |
| Document title pattern | `{Page} \| LiAlvaro T-Shirt Printing` |
| Topbar left | `[claim:same-day-printing]` · Call `[claim:phone-310-904-2655]` |
| Topbar right | Cart · Sign in |
| Nav | Services · Store · Design Studio · FAQs |
| Nav primary button | Get a quote → quote modal |
| *(locked)* | See `docs/OWNER_LOCKS.md` — do not restore Shop now / Custom Printing nav |
| Footer tagline | Custom apparel printing in Los Angeles — design online or request a quote. |
| Footer copyright | © {year} LiAlvaro T-Shirt Printing. All rights reserved. Los Angeles, CA. |
| Footer legal | Privacy Policy · Terms of Service *(real routes, never `#`)* |

---

## Home (`/`)

### Hero
| Slot | Copy |
|---|---|
| Eyebrow / brand | LiAlvaro · Los Angeles · `[claim:methods-screen-dtg-dtf-embroidery]` |
| H1 | Fast, Easy, High-Quality<br>Custom Apparel Printing (break after Quality) |
| Subhead (with same-day) | Start Designing in our Design Studio, or get a free quote for custom and bulk work. `[claim:same-day-printing]` |
| Subhead (fallback if same-day unconfirmed) | Start Designing in our Design Studio, or get a free quote for custom and bulk work. |
| Primary CTA | Start Designing → `/design/` |
| Secondary CTA | Get a free quote → quote modal `[claim:free-quote]` |
| Tertiary | *(removed from hero — phone stays in top bar)* |

### How it works
| Slot | Copy |
|---|---|
| Eyebrow | How it works |
| H2 | Three steps. No runaround. |
| Step 1 | Choose your path — design online or request a quote. |
| Step 2 | Approve your art and pricing. |
| Step 3 | We print and get it to you. |
| Primary CTA | Start your design → |

### Featured products (Shop teaser)
| Slot | Copy |
|---|---|
| Eyebrow | Shop |
| H2 | Standard products with clear pricing. |
| Body | Browse ready-to-order items. Custom and bulk jobs use a quote instead. |
| Primary CTA | Shop products → |
| Empty state | Products will appear here when the catalog is published. |

### Print methods
| Slot | Copy |
|---|---|
| Eyebrow | Custom printing |
| H2 | The right method for the job. |
| Body | `[claim:methods-screen-dtg-dtf-embroidery]` Tell us about quantity, garment, and timing — we’ll recommend a path. |
| Primary CTA | Get a custom quote → |

### Reviews
| Slot | Copy |
|---|---|
| Eyebrow | Customer reviews |
| H2 | What people say. |
| Note | No star-count or “X+ reviews” until owner supplies a verifiable source. |

**Approved review set (real):**

1. **Leighton C.** — “I had my logo designed and my t-shirts and polos printed here several years ago. Since then, I've had banners, posters, hats, and, many other products done by LTP (even ugly sweaters for Christmas of 2024). Li is so friendly and patient. I recommend LiAlvaro T-shirt Printing to everyone.”  
   *(Publish with typo fix “had”; keep “LTP” as written — owner confirmed 2026-10-21.)*

2. **Mark L.** — “I will never use another company for my Custom Printing needs. These guys do a wonderful job.”

3. **Richard L.** — “Truly 5 stars - This was so easy, even for my large, complicated order. Li at LiAlvaro T-shirt Printing guided me through the process and was super responsive to my questions. The shirts are comfortable, the design is perfect. We all love them. This was a great experience!”

4. **Melinda M.** — “Responded quickly and delivered beautifully!”

5. **Calvary Chapel Crenshaw** — “Excellent service all the time. Thanks Li.”

### Short FAQ (home)
Use answers only after related claims are confirmed.

| Question | Answer draft |
|---|---|
| Shop vs quote? | Shop is for standard products with listed prices. A quote is for bulk, specialty garments, or projects that need a custom plan. |
| Minimum order? | `[claim:no-minimums]` |
| How fast? | `[claim:turnaround-standard-5-7]` `[claim:same-day-printing]` |
| Primary CTA | View the full FAQ → |

### Final CTA band
| Slot | Copy |
|---|---|
| H2 | Ready when you are. |
| Body | Questions? Call us — we’re happy to help. *(Do not use `[claim:support-24-7]` — owner set confirmed false.)* |
| Primary CTA | Get a free quote → `[claim:free-quote]` |
| Secondary CTA | Call `[claim:phone-310-904-2655]` |

---

## Shop (`/shop/`)

| Slot | Copy |
|---|---|
| Meta title | Shop \| LiAlvaro T-Shirt Printing |
| H1 | Shop |
| Subhead | Standard products with listed prices. Need bulk or something custom? Request a quote. |
| Filter: all | All |
| Filter: apparel | Apparel |
| Filter: headwear | Headwear & accessories |
| Card CTA | Add to cart |
| Card CTA success | Added |
| Primary page CTA (if empty catalog) | Get a custom quote → |
| Empty catalog | No products to show yet. Check back soon or request a custom quote. |
| Empty filter | No products in this category. Try All. |
| Cart empty (shop context) | Your cart is empty. Browse products to get started. |
| Same-day note (PDP/cart, local eligible only) | `[claim:same-day-printing]` |
| POD items | Never label as same-day. |

### Product detail (future `/shop/[slug]/`)
| Slot | Copy |
|---|---|
| Add to cart | Add to cart |
| Buy disabled | Unavailable |
| Out of stock | This item is unavailable right now. |
| Secondary | Need a different quantity or garment? Get a quote → |

---

## Design Studio (`/design/`)

| Slot | Copy |
|---|---|
| Meta title | Design Studio \| LiAlvaro T-Shirt Printing |
| H1 | Design Studio |
| Subhead | Ready to order? Choose a product, add your design, and place your order. |
| Primary CTA | Start Designing |
| Guest note | You can design now and save the design to an account when you sign in. |
| Upload CTA | Upload image |
| Upload help | PNG, JPG, or SVG. We’ll flag quality issues before you pay. |
| Text tool | Add text |
| Undo / Redo | Undo · Redo |
| Product switch | Change product |
| Side switch | Front · Back |
| Preflight warn DPI | This image may print soft (low resolution). Use a larger file if you can. |
| Preflight warn size | This file is large. Try a smaller export for faster upload. |
| Preflight missing transparency | This file may not have a transparent background. |
| Price line | Price updates as you change product and options. Final price is confirmed at checkout. |
| CTA checkout | Continue to checkout |
| CTA save | Save design |
| Empty canvas | Add an image or text to get started. |
| Error export | We couldn’t prepare your print file. Try again or call `[claim:phone-310-904-2655]`. |
| Success export | Design ready — continue to checkout. |
| IP attestation | I confirm I have the right to use this artwork. |
| Report artwork | Report a design |

---

## Custom Printing page — REMOVED

**Owner lock 2026-10-26:** `/custom-printing/` is deleted. All non–Design Studio orders/inquiries use the **quote modal**. Do not recreate this page in later stages. Legacy URL **301 → `/?quote=1`**.

### Quote form (aligned with current modal steps)

**Step labels**
1. Select a service *(optional)*
2. What would you like to design?
3. Blanks & design upload
4. Your details

| Field / UI | Copy |
|---|---|
| Services | Screen Printing · DTG Printing · Direct to Film · Embroidery |
| Design types | Tops · Bottoms · Hats · Bags · Something else |
| Colors label | How many colors are in your design? |
| Pieces label | How many pieces do you need? |
| Blanks question | Will you be providing the blank(s)? |
| Blanks yes/no | Yes · No |
| Material label | What type of material is your blank? |
| Upload | Drag & drop your design, or browse |
| Notes | Project details (deadline, event, placement, etc.) |
| Name / phone / email | First name · Last name · Phone · Email |
| Submit | Get my free quote → `[claim:free-quote]` |
| Success | Thanks — your quote request is in. We’ll follow up by email soon. |
| Error submit | Something went wrong sending your request. Please call `[claim:phone-310-904-2655]`. |
| Validation: design type | Select at least one item type. |
| Validation: pieces | Enter a quantity of 1 or more. |
| Validation: colors | Select how many colors are in your design. |
| Validation: blanks | Tell us if you’re providing blanks. |
| Validation: material | Enter the blank material. |
| Validation: contact | Enter your first name, last name, phone, and a valid email. |
| File note | You can upload files here; if upload isn’t available, we’ll ask for art by email. |

---

## Shared microcopy

### Forms (general)
| State | Copy |
|---|---|
| Required indicator | * (required) |
| Optional | (optional) |
| Network error | Network error — check your connection and try again. |
| Generic error | Something went wrong. Please try again or call us. |
| Sending | Sending… |
| Uploading | Uploading… |

### Cart / checkout (commerce later)
| State | Copy |
|---|---|
| Empty cart | Your cart is empty. |
| Empty cart CTA | Continue shopping |
| Begin checkout | Checkout |
| Checkout error | Checkout couldn’t start. Try again or call us. |
| Order confirmed H1 | Order confirmed |
| Order confirmed body | Thanks — we received your payment. We’ll email next steps shortly. |
| Track CTA | Track your order |

### Errors / 404
| Slot | Copy |
|---|---|
| 404 H1 | Page not found |
| 404 body | That link doesn’t go anywhere. Try the shop, design studio, or home. |
| 404 CTA | Back to home |

---

## Dark patterns — explicitly out of scope

Do **not** use: fake countdown timers, “X people viewing”, inflated stock scarcity, pre-checked newsletter boxes, forced account creation before quote, or bait pricing that changes only at checkout without explanation.

---

## Owner checklist (Stage 1 gate) — closed 2026-10-21

- [x] Approve strategy audiences + homepage hierarchy (`docs/strategy.md`)
- [x] Approve this copy deck
- [x] Claims: same-day true; 24/7 false; all others true (`src/data/claims.json`)
- [x] Keep “LTP” inside Leighton C.’s review as written
