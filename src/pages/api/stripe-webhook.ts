import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { getDb } from '../../lib/db';
import { getAppEnv } from '../../lib/env';
import { createPaidOrderFromStripe } from '../../lib/orders';
import { sendCustomerEmail, sendOwnerEmail } from '../../lib/email';
import { getStripe, webhookCryptoProvider } from '../../lib/stripe-client';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function shippingFrom(session: Stripe.Checkout.Session) {
  return (
    session.collected_information?.shipping_details ??
    session.shipping_details ??
    session.customer_details ??
    null
  );
}

export const POST: APIRoute = async ({ request }) => {
  const env = await getAppEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'Stripe webhook is not configured.' }, 503);
  }

  const stripe = getStripe(env.STRIPE_SECRET_KEY);
  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'Missing Stripe signature.' }, 400);

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      webhookCryptoProvider(),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature.';
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    let lines: Array<{ variantId: string; quantity: number }> = [];
    try {
      lines = JSON.parse(session.metadata?.cart ?? '[]') as Array<{ variantId: string; quantity: number }>;
    } catch {
      lines = [];
    }

    if (!lines.length) {
      await sendOwnerEmail({
        subject: `Paid order missing cart metadata — ${session.id}`,
        text: `Session ${session.id} completed but metadata.cart was empty.\nEmail: ${session.customer_details?.email}`,
      });
      return json({ received: true, warning: 'missing_cart_metadata' });
    }

    const db = await getDb();
    let trackingCode = '';
    let orderId = '';
    try {
      const result = await createPaidOrderFromStripe({
        db,
        stripeSessionId: session.id,
        paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        email: session.customer_details?.email,
        amountTotal: session.amount_total,
        shipping: shippingFrom(session),
        lines,
        sameDayRequested: session.metadata?.same_day_requested === '1',
      });
      orderId = result.orderId;
      trackingCode = result.trackingCode;
    } catch (err) {
      await sendOwnerEmail({
        subject: `Order needs attention — ${session.id}`,
        text: `Payment succeeded but order write failed.\nSession: ${session.id}\nError: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }

    const email = session.customer_details?.email;
    if (email && trackingCode) {
      await sendCustomerEmail({
        to: email,
        subject: 'Your LiAlvaro order is confirmed',
        text: `Thanks for your order.\n\nWe’ll print and fulfill your order.\nTrack anytime: https://www.lialvaro.com/track/?code=${trackingCode}\nOrder id: ${orderId}`,
      });
    }

    await sendOwnerEmail({
      subject: `New order — production queue — ${orderId || session.id}`,
      text: `New paid order ready to print.\nCustomer: ${email ?? 'unknown'}\nTracking: ${trackingCode}\nSession: ${session.id}\nShipping: ${JSON.stringify(
        shippingFrom(session),
        null,
        2,
      )}\n\nVendor cuts are recorded as owed; remit after fulfillment.`,
    });
  }

  return json({ received: true });
};
