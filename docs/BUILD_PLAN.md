# LiAlvaro: Staged Build Plan (for Cursor)

Save as `docs/BUILD_PLAN.md`. To run a stage, tell Cursor:
"Read docs/BUILD_PLAN.md fully. Execute Stage N only, follow the Stage Protocol, then STOP."

---

## A. Rules of engagement (apply to every stage)

**Stage Protocol.** For each stage, in this order:
1. Restate your understanding in 5 lines and list your assumptions.
2. Ask up to 5 blocking questions. If any are blocking, stop and wait. Otherwise proceed.
3. Implement only what the stage lists. No work from later stages.
4. Verify yourself by running the checks named in the stage gate.
5. Write `docs/stage-reports/stage-N.md`: what was built, evidence (command output, scores, screenshots), open issues, decisions needing the owner.
6. STOP. Do not begin the next stage.

**Never invent business facts.** Prices, turnaround times, cutoffs, stats, testimonials, product specs, and service claims come from owner-editable files in `src/data/` (`site.json`, `claims.json`, `pricing.json`, `reviews.json`, `same-day.json`). Missing value: show a visible TODO in dev and fail the production build. Every public claim must exist in `claims.json` with `"confirmed": true`.

**Interpretation guardrails.** Cursor builds from specs, so subjective choices must be made visible:
- For any design decision the spec doesn't settle, build two options on a `noindex` route under `/_preview/` and let the owner choose. Don't pick silently.
- Capture Playwright screenshots at 375, 768 and 1280 px for every new page and put them in the stage report. The owner reviews screenshots, not code.
- If the spec and the repo conflict, or two requirements conflict, ask.

**Public language rule (important).**
- "Same-day printing" MAY be advertised, and the existing same-day page/keywords stay.
- The fact that the owner produces same-day work in-house must NOT be publicized or implied. Never use: "in-house", "our shop floor", "our presses", "our facility", "on-site", "made in our studio", "our artisans", or photos/captions of a production floor. Neutral first-person ("we", "our team") is fine.
- Never name POD vendors (Printful, Printify, etc.) in customer-facing pages, emails, order pages, or tracking. Use our own order and tracking page with the carrier number. Use the provider's white-label/branded packing-slip options where available (verify in current docs).
- Same-day is promised only where eligible: eligible products, LA-area ZIPs, and cutoff time come from `same-day.json`. POD items are never described as same-day. Public wording: "Same-day printing available for select orders in Los Angeles. Call to confirm."

**Quality bars.** WCAG 2.2 AA, mobile-first, keyboard-navigable, `prefers-reduced-motion` respected. TypeScript strict. No `any` without a comment. No dead links (`#` is not a page).

**Owner locks (mandatory).** Before implementing any stage, read `docs/OWNER_LOCKS.md`. Owner-approved chrome, hero, Design Studio vs quote split, and the removal of `/custom-printing/` **must not be reverted** by later stages. If this plan conflicts with `OWNER_LOCKS.md`, follow the locks and note the override in the stage report.

---

## B. Business model (reference for all stages)

One storefront, three internal lanes. Customers never see lane names.

| Lane | Meaning | Fulfilment |
|---|---|---|
| `local` | Owner produces the item (incl. same-day for eligible LA orders) | Admin production queue |
| `pod` | Print-on-demand: client stores, owner listings, customer-designed items | Provider API (Printful first, behind a provider interface) |
| `broker` | Work outside owner's scope | Quote -> customer pays -> owner sources from partner -> tracked |

One catalog, one cart, one order record. Each `order_item` carries a `lane`. Routing is by rule.

---

## C. Staged plan

### Stage 0: Audit and baseline (no feature code)
**Goal:** know exactly what exists before changing it.
**Do:**
- Summarize the repo: Astro version, adapters, routes, components, styles, env vars, deploy config.
- Inventory every live URL (crawl the sitemap/nav) and propose a redirect map. Keep `/design-your-apparel`, `/about`, `/faq`, `/articles`, `/contact`.
- Record baselines on the live site: Lighthouse mobile (perf/a11y/SEO/best-practices), page weights, Core Web Vitals if available.
- Note defects: canonical is `www` while the site serves the apex domain; brand name used inconsistently (LiAlvaro Apparel / LiAlvaro T-Shirt Printing / "LTP"); typo in the first review; Privacy/Terms links point to `#`.
- Document the existing multi-step quote modal's fields and steps.
**Deliverable:** `docs/audit.md`, `docs/redirects.md`.
**Gate:** owner approves the audit and the single brand name.

### Stage 1: Strategy and messaging
**Goal:** decide what the site says and to whom, before designing it.
**Do:**
- Write 3 audience profiles with their top tasks: (1) local organizations/individuals needing quick, reliable printing; (2) anyone wanting to design and buy custom apparel online; (3) businesses needing print services beyond standard apparel.
- Write a messaging hierarchy for the homepage: headline, subhead, proof, one primary CTA per section.
- Write the voice guide and a claims register draft (`src/data/claims.json`): every public claim (same-day, 24/7 support, 1-business-hour quote response, no minimums, free quote) with `confirmed: false` for the owner to flip.
- Write the copy deck for Home, Shop, Design Studio, Custom Printing, with microcopy for forms, errors, empty and success states. Use only confirmed claims and real reviews.
- No dark patterns, no fake urgency/scarcity.
**Deliverable:** `docs/strategy.md`, `docs/copy-deck.md`, `src/data/claims.json`.
**Gate:** owner approves copy and confirms or edits each claim.

### Stage 2: Information architecture, flows, wireframes
**Goal:** structure before pixels.
**Do:**
- Sitemap: `/`, `/shop`, `/shop/[category]`, `/shop/[slug]`, `/stores/[client-slug]`, `/design`, `/cart`, `/order-confirmed`, `/track`, `/account/*`, `/admin/*`, plus existing pages. **Do not add `/custom-printing`** (owner lock — quote modal only; 301 legacy URL).
- User flows for: browse -> buy; design -> buy; request quote (modal); reorder; client store purchase; same-day inquiry.
- Low-fidelity wireframes as plain HTML/CSS with no styling beyond layout (at 375 and 1280), one per key page: section order, content slots, CTA placement.
- Homepage structure: value proposition; two paths ("Start Designing" primary → Design Studio, "Get a free quote" secondary → modal); review proof with real count/link; featured products; 3-step "how it works"; client-stores strip; short FAQ; footer. One primary CTA per section. See `docs/OWNER_LOCKS.md` for locked hero H1 and nav.
**Deliverable:** `docs/ia.md`, `docs/flows.md`, `/_preview/wireframes/*` (noindex), screenshots.
**Gate:** owner approves wireframes.

### Stage 3: Design system and living styleguide
**Goal:** one source of truth for look and feel.
**Do:**
- Tokens (single CSS file): canvas `#EFEBE1`, ink `#1B2233`, print-red `#C8102E`, gold `#B8912A`, mesh-grey `#8B8B85`, white `#FFFDF9`.
- Fonts: Anton (display), Inter (body), IBM Plex Mono (prices/specs), self-hosted, preloaded, with fallbacks.
- Motifs: registration-mark crosshairs, dashed cut-line dividers, hangtag product cards.
- Component inventory built in Astro: Button, Field/Input/Select/Textarea, FileDrop, ProductCard, PriceTag, Badge, Header/Nav/MobileMenu, Footer, Section, Accordion, ReviewCard, StepList, Modal/Drawer, Toast, Photo (obviously swappable placeholder).
- Every component documents and renders its states: default, hover, focus, disabled, loading, error, empty.
- Build `/_styleguide` (noindex) showing all of it.
**Deliverable:** `src/styles/tokens.css`, components, `/_styleguide`, screenshots.
**Gate:** owner approves look; `axe` reports zero critical/serious issues on the styleguide.

### Stage 4: Foundation build (real pages, no commerce)
**Goal:** a fast, credible, high-converting front end on the new system.
**Do:**
- Layout, header/nav, footer (real Privacy and Terms scaffolds with TODO banners for owner-supplied text).
- New homepage per approved wireframe + copy deck + styleguide.
- Port existing pages (About, FAQ, Articles, Contact, Design Your Apparel) to the new system without changing URLs.
- Fix canonical/host (pick one, 301 the other). Implement the redirect map.
- SEO: metadata per page, JSON-LD (`LocalBusiness`, `FAQPage`), sitemap, robots.
- Analytics events scaffolded: `quote_started`, `quote_step_N`, `quote_submitted`, `design_started`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`. Ask the owner: GA4 or Plausible; add Clarity.
- Performance budget: mobile LCP < 2.5s, CLS < 0.1, INP < 200ms.
**Gate:** Cloudflare preview URL; Lighthouse mobile perf >= 90, a11y >= 95, SEO >= 95 (attach reports); every old URL resolves or 301s.

### Stage 5: Commerce core (catalog, cart, checkout, orders)
**Goal:** money in, orders reliably out.
**Do:**
- D1 schema: `users`, `products`, `variants`, `stores`, `carts`, `orders`, `order_items` (lane, provider, provider_order_id, status), `quotes`, `designs`, `events` (audit log), `webhook_events` (Stripe event IDs for idempotency). Propose the schema first; migrations versioned.
- Provider interface: `listProducts`, `getVariants`, `getShippingRates`, `createOrder`, `getOrderStatus`, `handleWebhook`. Implement Printful. Verify every endpoint against the CURRENT official docs, not memory. Sync catalog to D1 on a schedule; page renders never call vendor APIs.
- Pricing: vendor cost + shipping + markup rules (`pricing.json`), computed server-side only. Admin-visible margin per product.
- `/shop`, category and product pages, cart. Stripe Checkout + Stripe Tax (California). Webhook with `constructEventAsync` and SubtleCrypto (Workers runtime), idempotent.
- Order router: `pod` -> provider order with retry/backoff; permanent failure -> status `needs_attention` + owner email. A paid order must never disappear silently.
- Same-day: checkout offers a same-day request only for eligible `local` items, ZIPs and before the cutoff from `same-day.json`; otherwise a "call to confirm" path.
- White-label emails (Resend) and our own `/track` page.
**Gate:** Stripe test-mode order produces a DRAFT order at the provider; Stripe CLI webhook replay proves idempotency; forced provider failure lands in `needs_attention`; then the owner places one live sample order and confirms the physical item arrives.

### Stage 6: Design Studio (`/design`)
**Goal:** a customer can design a shirt on a phone and buy it.
**Do:**
- Canvas editor with Fabric.js or Konva (choose one, justify in two lines). Touch-friendly.
- Print areas in px at 300 DPI per product/placement, from the provider's file guidelines (cached).
- Features: upload PNG/JPG/SVG, text (limited open-license fonts), colour, layers, undo/redo, product + colour switch, front/back, mockup preview.
- Preflight: warn under ~150 effective DPI, large files, missing transparency; enforce size limits.
- Export print-ready PNG per placement to R2. Server recomputes price and validates files; never trust client-sent values.
- Don't depend on Printful's Embedded Design Maker (access is gated by request); submit our exported file through the order API.
- IP safeguards: attestation checkbox, Terms clause, report/takedown form that flags the item in admin. Do not claim automated copyright detection.
- Guests design via cookie session; designs attach to the account on login.
**Gate:** Playwright e2e (design -> export -> checkout -> provider draft order); provider accepts the file with no errors; five-person unmoderated phone test script prepared for the owner.

### Stage 7: Members, client stores, admin
**Do:**
- Magic-link login (no passwords). Account: order history and tracking, saved designs, one-click reorder, addresses, artwork library. Never store card data.
- Client storefronts at `/stores/[slug]`: product selection, optional per-store markup, public or unlisted, optional LA pickup for eligible items.
- Admin (`/admin`, owner-only via Cloudflare Access or role check): orders by lane, `needs_attention` queue, same-day queue (`rush_local`), product/store editor, margin report.
**Gate:** Playwright covers login, reorder, client-store purchase; admin shows the forced-failure order; admin routes return 401/403 to non-owners.

### Stage 8: Broker lane and quote flow
**Do:**
- Rebuild the existing multi-step quote modal's steps (service, category, quantity, blanks, upload, notes, contact) as a **global modal only** (no `/custom-printing` page — owner lock), storing submissions in D1 and emailing the owner.
- Admin quote builder: line items, partner cost, markup, deposit, send a Stripe payment link; customer-facing quote page; status tracking.
**Gate:** full broker test (request -> quote -> pay -> tracked -> delivered status); quote step analytics visible.

### Stage 9: Hardening and launch
**Do:**
- Security: secrets only in Cloudflare; upload validation (type, magic bytes, size); Turnstile and rate limits on forms; strict CSP and security headers; no PII in logs.
- Full Playwright suite in CI, `axe` on all templates, Lighthouse CI budgets, checkout load test.
- Content QA: no TODOs, no unconfirmed claims, no banned phrases from the public-language rule (add an automated grep check for them).
- Soft launch to existing customers; monitoring/alerts for webhook and provider failures.
- Post-launch: weekly metrics report template (visits, quote starts/completions, design starts/exports, add-to-cart, purchases, abandonment by step).
**Gate:** all CI green; owner sign-off; redirects verified on production.

---

## D. Definition of done
- Every stage report has its gate evidence.
- `build`, type-check, lint, Playwright pass in CI.
- No fabricated data; every claim in `claims.json` is owner-confirmed.
- README documents env vars, secrets, deploy, and how the owner edits `src/data/*`.
