import type { APIRoute } from 'astro';
import { isOwnerEmail, readSession, SESSION_COOKIE } from '../../../lib/auth';
import { getDb, insertAuditEvent } from '../../../lib/db';
import { sendCustomerEmail } from '../../../lib/email';
import { getAppEnv } from '../../../lib/env';
import {
  amountDueCents,
  dollarsToCents,
  lineTotalCents,
  markQuotePaid,
  replaceQuoteLines,
  type QuoteLine,
} from '../../../lib/quotes';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Body = {
  action?: string;
  quoteId?: string;
  lines?: Array<{ label?: string; quantity?: string | number; unit?: string }>;
  partnerCost?: string;
  markup?: string;
  deposit?: string;
  trackingCode?: string;
};

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const session = await readSession(cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: 'Sign in required.' }, 401);
  if (!(await isOwnerEmail(session.email))) return json({ error: 'Owner only.' }, 403);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const quoteId = String(body.quoteId ?? '');
  if (!/^quo_[a-z0-9]+$/i.test(quoteId)) return json({ error: 'Unknown quote.' }, 404);
  const db = await getDb();
  if (!db) return json({ error: 'Quotes need the site database.' }, 503);

  const quote = await db
    .prepare('SELECT id, email, name, status, public_token FROM quotes WHERE id = ?')
    .bind(quoteId)
    .first<{ id: string; email: string | null; name: string | null; status: string; public_token: string | null }>();
  if (!quote) return json({ error: 'Unknown quote.' }, 404);

  const action = String(body.action ?? '');

  if (action === 'save' || action === 'send') {
    const lines: QuoteLine[] = [];
    for (const raw of body.lines ?? []) {
      const label = String(raw.label ?? '').trim().slice(0, 160);
      if (!label) continue;
      const quantity = Number(raw.quantity);
      const unitCents = dollarsToCents(raw.unit);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
        return json({ error: 'Each line needs a quantity of at least 1.' }, 400);
      }
      if (unitCents === null) return json({ error: 'Enter prices like 12.50.' }, 400);
      lines.push({ label, quantity, unitCents });
    }
    if (!lines.length) return json({ error: 'Add at least one line.' }, 400);

    const partner = dollarsToCents(body.partnerCost);
    const markup = dollarsToCents(body.markup);
    const deposit = dollarsToCents(body.deposit);
    if (partner === null || markup === null || deposit === null) {
      return json({ error: 'Enter partner cost, markup, and deposit like 12.50.' }, 400);
    }
    const total = lineTotalCents(lines);
    if (deposit > total) return json({ error: 'The deposit cannot be more than the quote total.' }, 400);

    await replaceQuoteLines(db, quoteId, lines);
    await db
      .prepare(
        `UPDATE quotes
         SET partner_cost_cents = ?, markup_cents = ?, deposit_cents = ?, total_cents = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      )
      .bind(partner, markup, deposit, total, quoteId)
      .run();

    if (action === 'save') {
      await insertAuditEvent(db, 'quote', quoteId, 'quote_saved', { total, partner, markup, deposit });
      return json({ ok: true });
    }

    if (!quote.public_token || !quote.email) return json({ error: 'This request has no customer email.' }, 400);
    const page = new URL(`/quotes/${quote.public_token}/`, url.origin).toString();
    const due = amountDueCents(total, deposit);
    const env = await getAppEnv();
    const emailed = await sendCustomerEmail({
      to: quote.email,
      subject: 'Your LiAlvaro quote is ready',
      text: `Your quote is ready.\n\nAmount due now: $${(due / 100).toFixed(2)}\nReview and pay: ${page}\n`,
    });
    if (!emailed && !import.meta.env.DEV) {
      return json({ error: 'The quote was saved, but email is not configured. Set RESEND_API_KEY.' }, 503);
    }
    if (!env.STRIPE_SECRET_KEY && !import.meta.env.DEV) {
      return json({ error: 'The quote was saved, but card checkout is not configured.' }, 503);
    }

    await db
      .prepare(
        `UPDATE quotes SET status = 'quoted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      )
      .bind(quoteId)
      .run();
    await insertAuditEvent(db, 'quote', quoteId, 'quote_sent', { page, emailed });
    return json({ ok: true, emailed, page });
  }

  if (action === 'record-payment') {
    if (quote.status !== 'quoted') {
      return json({ error: 'Email the quote before recording payment.' }, 400);
    }
    const money = await db
      .prepare('SELECT total_cents, deposit_cents FROM quotes WHERE id = ?')
      .bind(quoteId)
      .first<{ total_cents: number; deposit_cents: number }>();
    const result = await markQuotePaid({
      db,
      quoteId,
      stripeSessionId: `manual_${quoteId}`,
      email: quote.email,
      amountTotal: money ? amountDueCents(money.total_cents, money.deposit_cents) : null,
    });
    return json({ ok: true, ...result });
  }

  if (action === 'status') {
    const next = String((body as { status?: string }).status ?? '');
    if (next !== 'tracked' && next !== 'delivered' && next !== 'canceled') {
      return json({ error: 'Unknown status.' }, 400);
    }
    if ((next === 'tracked' || next === 'delivered') && quote.status !== 'paid' && quote.status !== 'tracked') {
      return json({ error: 'Mark the quote paid before tracking it.' }, 400);
    }
    const tracking = String(body.trackingCode ?? '').trim().slice(0, 40);
    await db
      .prepare(
        `UPDATE quotes
         SET status = ?, tracking_code = COALESCE(NULLIF(?, ''), tracking_code),
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      )
      .bind(next, tracking, quoteId)
      .run();
    const row = await db.prepare('SELECT order_id FROM quotes WHERE id = ?').bind(quoteId).first<{ order_id: string | null }>();
    if (row?.order_id && next !== 'canceled') {
      const orderStatus = next === 'delivered' ? 'fulfilled' : 'in_production';
      await db
        .prepare(`UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
        .bind(orderStatus, row.order_id)
        .run();
    }
    await insertAuditEvent(db, 'quote', quoteId, 'quote_status', { status: next, tracking });
    return json({ ok: true });
  }

  return json({ error: 'Unknown action.' }, 400);
};
