import type { APIRoute } from 'astro';
import { getVariantById, isVariantId } from '../../lib/catalog';
import { getAppEnv } from '../../lib/env';
import { getStripe } from '../../lib/stripe-client';
import { getPricingConfig } from '../../lib/pricing';

export const prerender = false;

type CartItem = { variantId?: unknown; id?: unknown; qty?: unknown; quantity?: unknown };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    let payload: { items?: CartItem[]; sameDayRequested?: boolean };
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) return json({ error: 'Cart is empty' }, 400);

    const lineItems = items.map((item) => {
      const variantId = String(item.variantId ?? item.id ?? '');
      if (!isVariantId(variantId)) throw new Error(`Unknown variant: ${variantId}`);
      const qty = Number(item.qty ?? item.quantity);
      if (!Number.isFinite(qty) || qty < 1) throw new Error('Invalid quantity.');
      const variant = getVariantById(variantId)!;
      return {
        price_data: {
          currency: 'usd' as const,
          product_data: {
            name: variant.name,
            metadata: {
              variant_id: variant.id,
              lane: variant.lane,
              product_id: variant.product.id,
            },
          },
          unit_amount: variant.retailPriceCents,
        },
        quantity: Math.max(1, Math.min(qty, 20)),
      };
    });

    const env = await getAppEnv();
    if (!env.STRIPE_SECRET_KEY) {
      return json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' }, 503);
    }

    const pricing = getPricingConfig();
    const stripe = getStripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${url.origin}/order-confirmed/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/cart/`,
      shipping_address_collection: { allowed_countries: ['US'] },
      automatic_tax: pricing.tax.stripe_automatic_tax ? { enabled: true } : undefined,
      metadata: {
        same_day_requested: payload.sameDayRequested ? '1' : '0',
        cart: JSON.stringify(
          items.map((item) => ({
            variantId: String(item.variantId ?? item.id),
            quantity: Math.max(1, Math.min(Number(item.qty ?? item.quantity) || 1, 20)),
          })),
        ),
      },
    });

    return json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not start checkout.';
    return json({ error: message }, 500);
  }
};
