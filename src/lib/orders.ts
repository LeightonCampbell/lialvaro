import { getVariantById, lineVendorCutCents } from './catalog';
import { insertAuditEvent, newId, recordWebhookEvent } from './db';
import { canRequestSameDay } from './same-day';

export type CheckoutLine = {
  variantId: string;
  quantity: number;
};

export function buildTrackingCode(): string {
  return `LA${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * After Stripe payment: create order, queue for LiAlvaro production, record vendor cuts as owed.
 * No external POD provider.
 */
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
  const pieceCount = items.reduce((sum, i) => sum + i.line.quantity, 0);
  const shippingJson = opts.shipping ? JSON.stringify(opts.shipping) : null;
  const zip =
    opts.shipping && typeof opts.shipping === 'object' && opts.shipping !== null
      ? String(
          (opts.shipping as { postal_code?: string; zip?: string }).postal_code ??
            (opts.shipping as { address?: { postal_code?: string } }).address?.postal_code ??
            (opts.shipping as { zip?: string }).zip ??
            '',
        )
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
      const retailLine = item.variant.retailPriceCents * item.line.quantity;
      const cut = lineVendorCutCents(item.variant.product, retailLine);
      const sameDayOk =
        opts.sameDayRequested &&
        canRequestSameDay({
          lane: item.variant.lane,
          zip: zip || undefined,
          pieceCount,
        });
      const orderItemId = newId('oi');

      await opts.db
        .prepare(
          `INSERT INTO order_items (
            id, order_id, variant_id, product_name, variant_name, quantity, unit_price_cents,
            lane, vendor_id, vendor_cut_cents, vendor_payout_status, status, meta_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'local', ?, ?, 'owed', 'queued', ?)`,
        )
        .bind(
          orderItemId,
          orderId,
          item.variant.id,
          item.variant.product.name,
          item.variant.name,
          item.line.quantity,
          item.variant.retailPriceCents,
          item.variant.product.vendorId,
          cut,
          JSON.stringify({
            sameDayRequested: Boolean(sameDayOk),
            vendorName: item.variant.product.vendor.name,
            vendorCutBps: item.variant.product.vendorCutBps,
          }),
        )
        .run();

      await opts.db
        .prepare(
          `INSERT INTO vendor_payouts (id, vendor_id, order_item_id, amount_cents, status)
           VALUES (?, ?, ?, ?, 'owed')`,
        )
        .bind(newId('pay'), item.variant.product.vendorId, orderItemId, cut)
        .run();
    }

    // Owner production queue — not an external provider.
    await opts.db.prepare(`UPDATE orders SET status = 'in_production' WHERE id = ?`).bind(orderId).run();
    await insertAuditEvent(opts.db, 'order', orderId, 'queued_for_production', {
      stripeSessionId: opts.stripeSessionId,
      sameDayRequested: Boolean(opts.sameDayRequested),
    });
  }

  return { orderId, trackingCode };
}

export async function getOrderByTracking(db: D1Database | null, code: string) {
  if (!db) return null;
  return db.prepare('SELECT * FROM orders WHERE tracking_code = ?').bind(code).first();
}
