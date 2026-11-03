import type { APIRoute } from 'astro';
import { isOwnerEmail, readSession, SESSION_COOKIE } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

const STATUSES = ['in_production', 'fulfilled', 'needs_attention', 'canceled'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await readSession(cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: 'Sign in required.' }, 401);
  if (!(await isOwnerEmail(session.email))) return json({ error: 'Owner only.' }, 403);

  let body: { orderId?: string; status?: string };
  try {
    body = (await request.json()) as { orderId?: string; status?: string };
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const orderId = String(body.orderId ?? '');
  const status = String(body.status ?? '');
  if (!/^ord_[a-z0-9]+$/i.test(orderId)) return json({ error: 'Unknown order.' }, 404);
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return json({ error: 'Unknown status.' }, 400);

  const db = await getDb();
  if (!db) return json({ error: 'Orders need the site database.' }, 503);
  await db
    .prepare(`UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
    .bind(status, orderId)
    .run();
  return json({ ok: true });
};
