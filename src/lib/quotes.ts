import { insertAuditEvent, newId } from './db';
import { buildTrackingCode } from './orders';

export const QUOTE_STATUSES = ['open', 'quoted', 'paid', 'tracked', 'delivered', 'canceled'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export type QuoteLine = {
  label: string;
  quantity: number;
  unitCents: number;
};

export function quotePublicToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function dollarsToCents(value: unknown): number | null {
  const raw = String(value ?? '').trim().replace(/[$,]/g, '');
  if (!raw) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  return Math.round(Number(raw) * 100);
}

export function lineTotalCents(lines: QuoteLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitCents, 0);
}

/** What the customer is asked to pay now. A deposit, when set, is that amount. */
export function amountDueCents(totalCents: number, depositCents: number): number {
  if (depositCents > 0) return depositCents;
  return totalCents;
}

export function customerStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Request received';
    case 'quoted':
      return 'Quote ready';
    case 'paid':
      return 'Paid';
    case 'tracked':
      return 'On the way';
    case 'delivered':
      return 'Delivered';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Request received';
  }
}

export async function replaceQuoteLines(db: D1Database, quoteId: string, lines: QuoteLine[]): Promise<void> {
  await db.prepare('DELETE FROM quote_items WHERE quote_id = ?').bind(quoteId).run();
  for (const line of lines) {
    await db
      .prepare('INSERT INTO quote_items (id, quote_id, label, quantity, unit_cents) VALUES (?, ?, ?, ?, ?)')
      .bind(newId('qli'), quoteId, line.label, line.quantity, line.unitCents)
      .run();
  }
}

/**
 * Record a paid broker quote and open a trackable order.
 * Idempotent for the same Stripe session id.
 */
export async function markQuotePaid(opts: {
  db: D1Database;
  quoteId: string;
  stripeSessionId: string;
  paymentIntent?: string | null;
  amountTotal?: number | null;
  email?: string | null;
}): Promise<{ orderId: string; trackingCode: string }> {
  const existing = await opts.db
    .prepare('SELECT id, order_id, tracking_code, status FROM quotes WHERE id = ?')
    .bind(opts.quoteId)
    .first<{ id: string; order_id: string | null; tracking_code: string | null; status: string }>();
  if (!existing) throw new Error('Unknown quote.');
  if (existing.status === 'paid' || existing.status === 'tracked' || existing.status === 'delivered') {
    if (existing.order_id && existing.tracking_code) {
      return { orderId: existing.order_id, trackingCode: existing.tracking_code };
    }
  }

  const lines = (
    await opts.db
      .prepare('SELECT label, quantity, unit_cents FROM quote_items WHERE quote_id = ?')
      .bind(opts.quoteId)
      .all<{ label: string; quantity: number; unit_cents: number }>()
  ).results ?? [];
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_cents, 0);
  const paid = opts.amountTotal ?? subtotal;
  const orderId = newId('ord');
  const trackingCode = buildTrackingCode();

  await opts.db
    .prepare(
      `INSERT INTO orders (
        id, email, status, currency, subtotal_cents, shipping_cents, tax_cents, total_cents,
        stripe_session_id, stripe_payment_intent, tracking_code
      ) VALUES (?, ?, 'paid', 'usd', ?, 0, 0, ?, ?, ?, ?)`,
    )
    .bind(
      orderId,
      opts.email ?? null,
      subtotal,
      paid,
      opts.stripeSessionId,
      opts.paymentIntent ?? null,
      trackingCode,
    )
    .run();

  for (const line of lines) {
    await opts.db
      .prepare(
        `INSERT INTO order_items (
          id, order_id, product_name, variant_name, quantity, unit_price_cents, lane, status
        ) VALUES (?, ?, 'Custom quote', ?, ?, ?, 'broker', 'paid')`,
      )
      .bind(newId('oi'), orderId, line.label, line.quantity, line.unit_cents)
      .run();
  }

  await opts.db
    .prepare(
      `UPDATE quotes
       SET status = 'paid', stripe_session_id = ?, order_id = ?, tracking_code = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    )
    .bind(opts.stripeSessionId, orderId, trackingCode, opts.quoteId)
    .run();

  await insertAuditEvent(opts.db, 'quote', opts.quoteId, 'quote_paid', {
    orderId,
    trackingCode,
    stripeSessionId: opts.stripeSessionId,
  });

  return { orderId, trackingCode };
}
