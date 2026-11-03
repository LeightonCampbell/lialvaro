import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getAppEnv } from '../../../lib/env';
import { amountDueCents } from '../../../lib/quotes';
import { getStripe } from '../../../lib/stripe-client';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  let token = '';
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as { token?: string };
      token = String(body.token ?? '');
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }
  } else {
    const form = await request.formData();
    token = String(form.get('token') ?? '');
  }
  if (!/^[a-f0-9]{36}$/.test(token)) return json({ error: 'Unknown quote.' }, 404);

  const db = await getDb();
  if (!db) return json({ error: 'Payments need the site database.' }, 503);

  const quote = await db
    .prepare(
      `SELECT id, email, status, total_cents, deposit_cents FROM quotes WHERE public_token = ?`,
    )
    .bind(token)
    .first<{ id: string; email: string | null; status: string; total_cents: number; deposit_cents: number }>();
  if (!quote || quote.status !== 'quoted') return json({ error: 'This quote is not ready to pay.' }, 400);

  const due = amountDueCents(quote.total_cents, quote.deposit_cents);
  if (due < 50) return json({ error: 'This quote does not have an amount to pay yet.' }, 400);

  const env = await getAppEnv();
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Card checkout is not configured yet. Call us to pay.' }, 503);

  const lines = (
    await db
      .prepare('SELECT label, quantity, unit_cents FROM quote_items WHERE quote_id = ?')
      .bind(quote.id)
      .all<{ label: string; quantity: number; unit_cents: number }>()
  ).results ?? [];

  const stripe = getStripe(env.STRIPE_SECRET_KEY);
  const deposit = quote.deposit_cents > 0 && quote.deposit_cents < quote.total_cents;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: quote.email ?? undefined,
    line_items: deposit
      ? [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Quote deposit' },
              unit_amount: due,
            },
            quantity: 1,
          },
        ]
      : lines.map((line) => ({
          price_data: {
            currency: 'usd' as const,
            product_data: { name: line.label },
            unit_amount: line.unit_cents,
          },
          quantity: line.quantity,
        })),
    success_url: `${url.origin}/quotes/${token}/?paid=1`,
    cancel_url: `${url.origin}/quotes/${token}/`,
    metadata: {
      kind: 'quote',
      quote_id: quote.id,
    },
  });

  if (!session.url) return json({ error: 'Checkout did not return a link.' }, 502);
  return json({ url: session.url });
};
