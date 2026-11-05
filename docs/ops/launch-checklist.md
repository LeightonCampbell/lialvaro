# Launch checklist

Do this when deploying. Do not treat a local pass as production.

## Secrets

Set these on the Cloudflare Worker, not in the repo:

- `AUTH_SECRET`
- `RESEND_API_KEY`
- `ORDER_NOTIFICATION_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TURNSTILE_SECRET_KEY`
- `TURNSTILE_SITE_KEY`

Production quote and sign-in requests fail closed until Turnstile is set. Magic-link email fails closed until Resend and `AUTH_SECRET` are set.

## Database

Apply these to the remote D1 database named `lialvaro-commerce`:

- `migrations/0002_members.sql`
- `migrations/0003_broker_quotes.sql`

## Alerts

Watch these after launch:

- Stripe webhook deliveries. `GET /api/stripe-webhook` should stay `{ ok: true }`. Failed signature or 5xx responses need a look the same day.
- Resend bounces for order and quote mail.
- Checkout responses that are 500, not the expected 503 when a secret is missing.
- Quote posts that are 429 for a real customer, which means the hourly limit was hit.

## Soft launch

Send the existing-customer note yourself. This repo does not email that list. Include the site, the quote tab, and the phone number. Do not mention a print-on-demand platform.

## Redirects to confirm on the live host

- `https://lialvaro.com/` → `https://www.lialvaro.com/`
- `https://www.lialvaro.com/custom-printing/` → `https://www.lialvaro.com/?quote=1`
- `https://www.lialvaro.com/design-your-apparel/` → `https://www.lialvaro.com/design/`
