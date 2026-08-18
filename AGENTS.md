# Agent notes

## Cursor Cloud specific instructions

This is a single Astro site (`lialvaro-redesign`). Day-to-day development is **local Vite/Astro**, not Cloudflare.

- Install: `npm install` (Node `>=22.12.0`; lockfile is npm).
- Run the app: `npm run dev` — http://localhost:4321 (`host: true` in `astro.config.mjs`).
- Typecheck: `npx astro check` (no ESLint config and no automated test suite in this repo).
- Production-style local build: `npm run build` writes `./dist/`.
- Do **not** use `npm run preview`, `npm run deploy`, or `wrangler` unless the task is specifically about the Cloudflare Workers adapter. Preview/deploy go through Wrangler; that is not the local workflow.

Quote and design forms on `/contact`, `/about`, `/faq`, and `/design-your-apparel` still POST to Formspree (`https://formspree.io/f/xnjoaoyw`). The `/custom-printing` quote form POSTs JSON (`name`, `email`, `phone`, `quantity`, `garment`, `method`, `notes`) to `/api/quote-request` and emails via Resend from `quotes@lialvaro.com`. Design file uploads on that form are UI-only and are not attached to the email. Submitting either path from a cloud/agent session can send a real lead — intercept `/api/quote-request` and Formspree instead of posting to production.

Primary nav: Shop `/shop`, Custom Printing `/custom-printing`, About `/#about`, FAQ `/#faq`. Keep `/design-your-apparel`; it is no longer in the header. Shop filters use `data-category` (`apparel` | `headwear`; tote is headwear).

Store checkout is Stripe Checkout. Prices live in `src/lib/catalog.ts` (`amount` is cents) and must never be taken from the browser. Add buttons use `data-product-id`; header Checkout uses `data-checkout`. The cart POSTs `{ items: [{ id, qty }] }` to `/api/create-checkout-session`. The cart script is bundled from `src/scripts/cart.js` via `Layout.astro` — do not load `/src/scripts/cart.js` as a public URL. Order emails send from `orders@lialvaro.com` (needs a verified Resend domain). Quote emails send from `quotes@lialvaro.com`.

Local Stripe/Resend secrets go in `.env` (see `.env.example`). Production uses Cloudflare **Workers** secrets (`npx wrangler secret put NAME`), not Pages (`wrangler pages secret put`). Required names: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL`. The live webhook URL is `https://lialvaro.com/api/stripe-webhook` (`checkout.session.completed`). Middleware skips host and trailing-slash redirects for `/api` so Stripe POSTs are not 301’d.

Do not read `Astro.locals.runtime.env` (removed in Astro 6). Checkout and quote routes load secrets via `src/lib/checkout-env.ts`.

Standard scripts and project layout are in `README.md` and `package.json`.
