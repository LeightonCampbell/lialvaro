import { getVariantById } from './catalog';
import { insertAuditEvent, newId, recordWebhookEvent } from './db';
import { createPrintfulProvider } from './provider/printful';
import { getAppEnv } from './env';
import { canRequestSameDay } from './same-day';

export type CheckoutLine = {
  variantId: string;
  quantity: number;
};

export function buildTrackingCode(): string {
  return `LA${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createPaidOrderFromStripe(opts: {
  db: D1Database | null;
  stripeSessionId: string;
  paymentIntent?: string | null;
  email?: string | null;
  amountTotal?: number | null;
  shipping?: unknown;
  lines: CheckoutLine[];
  sameDayRequested?: boolean;
}): Promise<{ orderId: string; trackingCode: string }> {
  const orderId = newId('ord');
  const trackingCode = buildTrackingCode();
  const items = opts.lines.map((line) => {
    const variant = getVariantById(line.variantId);
    if (!variant) throw new Error(`Unknown variant ${line.variantId}`);
    return { line, variant };
  });

  const subtotal = items.reduce((sum, i) => sum + i.variant.retailPriceCents * i.line.quantity, 0);
  const shippingJson = opts.shipping ? JSON.stringify(opts.shipping) : null;
  const zip =
    opts.shipping && typeof opts.shipping === 'object' && opts.shipping !== null
      ? String((opts.shipping as { postal_code?: string; zip?: string }).postal_code ??
          (opts.shipping as { zip?: string }).zip ??
          '')
      : '';

  if (opts.db) {
    const isNew = await recordWebhookEvent(opts.db, 'stripe', opts.stripeSessionId);
    if (!isNew) {
      const existing = await opts.db
        .prepare('SELECT id, tracking_code FROM orders WHERE stripe_session_id = ?')
        .bind(opts.stripeSessionId)
        .first<{ id: string; tracking_code: string }>();
      if (existing) return { orderId: existing.id, trackingCode: existing.tracking_code };
    }

    await opts.db
      .prepare(
        `INSERT INTO orders (
          id, email, status, currency, subtotal_cents, shipping_cents, tax_cents, total_cents,
          stripe_session_id, stripe_payment_intent, shipping_json, same_day_requested, tracking_code
        ) VALUES (?, ?, 'paid', 'usd', ?, 0, 0, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        orderId,
        opts.email ?? null,
        subtotal,
        opts.amountTotal ?? subtotal,
        opts.stripeSessionId,
        opts.paymentIntent ?? null,
        shippingJson,
        opts.sameDayRequested ? 1 : 0,
        trackingCode,
      )
      .run();

    for (const item of items) {
      const sameDayOk =
        opts.sameDayRequested &&
        canRequestSameDay({ lane: item.variant.lane, zip: zip || undefined });
      await opts.db
        .prepare(
          `INSERT INTO order_items (
            id, order_id, variant_id, product_name, variant_name, quantity, unit_price_cents,
            lane, provider, status, meta_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        )
        .bind(
          newId('oi'),
          orderId,
          item.variant.id,
          item.variant.product.name,
          item.variant.name,
          item.line.quantity,
          item.variant.retailPriceCents,
          item.variant.lane,
          item.variant.product.provider ?? null,
          JSON.stringify({ sameDayRequested: Boolean(sameDayOk) }),
        )
        .run();
    }

    await insertAuditEvent(opts.db, 'order', orderId, 'paid', { stripeSessionId: opts.stripeSessionId });
  }

  await routeOrderItems({ orderId, trackingCode, items, shipping: opts.shipping, email: opts.email, db: opts.db });
  return { orderId, trackingCode };
}

async function routeOrderItems(opts: {
  orderId: string;
  trackingCode: string;
  items: Array<{ line: CheckoutLine; variant: NonNullable<ReturnType<typeof getVariantById>> }>;
  shipping: unknown;
  email?: string | null;
  db: D1Database | null;
}): Promise<void> {
  const env = await getAppEnv();
  const podItems = opts.items.filter((i) => i.variant.lane === 'pod');

  if (!podItems.length) return;

  if (!env.PRINTFUL_API_TOKEN) {
    if (opts.db) {
      await opts.db
        .prepare(`UPDATE order_items SET status = 'needs_attention' WHERE order_id = ? AND lane = 'pod'`)
        .bind(opts.orderId)
        .run();
      await opts.db.prepare(`UPDATE orders SET status = 'needs_attention' WHERE id = ?`).bind(opts.orderId).run();
      await insertAuditEvent(opts.db, 'order', opts.orderId, 'needs_attention', {
        reason: 'PRINTFUL_API_TOKEN missing',
      });
    }
    return;
  }

  const provider = createPrintfulProvider({
    token: env.PRINTFUL_API_TOKEN,
    storeId: env.PRINTFUL_STORE_ID,
  });

  const ship = (opts.shipping ?? {}) as Record<string, string>;
  try {
    const draft = await provider.createOrder({
      externalId: opts.orderId,
      recipient: {
        name: ship.name ?? 'Customer',
        address1: ship.line1 ?? ship.address1 ?? 'Address pending',
        address2: ship.line2 ?? ship.address2,
        city: ship.city ?? 'Los Angeles',
        state_code: ship.state ?? ship.state_code ?? 'CA',
        country_code: ship.country ?? 'US',
        zip: ship.postal_code ?? ship.zip ?? '90012',
        email: opts.email ?? undefined,
        phone: ship.phone,
      },
      items: podItems.map((i) => ({
        catalogVariantId: i.variant.providerVariantId ?? i.variant.id,
        quantity: i.line.quantity,
        retailPrice: (i.variant.retailPriceCents / 100).toFixed(2),
        name: i.variant.name,
      })),
    });

    if (opts.db) {
      await opts.db
        .prepare(`UPDATE order_items SET status = 'submitted', provider_order_id = ? WHERE order_id = ? AND lane = 'pod'`)
        .bind(String(draft.id), opts.orderId)
        .run();
      await opts.db.prepare(`UPDATE orders SET status = 'routing' WHERE id = ?`).bind(opts.orderId).run();
      await insertAuditEvent(opts.db, 'order', opts.orderId, 'provider_draft', { providerOrderId: draft.id });
    }
  } catch (err) {
    if (opts.db) {
      await opts.db
        .prepare(`UPDATE order_items SET status = 'needs_attention' WHERE order_id = ? AND lane = 'pod'`)
        .bind(opts.orderId)
        .run();
      await opts.db.prepare(`UPDATE orders SET status = 'needs_attention' WHERE id = ?`).bind(opts.orderId).run();
      await insertAuditEvent(opts.db, 'order', opts.orderId, 'provider_failure', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    // Owner email is sent by webhook caller when configured.
    throw err;
  }
}

export async function getOrderByTracking(db: D1Database | null, code: string) {
  if (!db) return null;
  return db
    .prepare('SELECT * FROM orders WHERE tracking_code = ?')
    .bind(code)
    .first();
}
