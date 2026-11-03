import type { APIRoute } from 'astro';
import { readSession, SESSION_COOKIE } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type ItemRow = {
  variant_id: string | null;
  quantity: number;
  meta_json: string | null;
};

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await readSession(cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: 'Sign in required.' }, 401);
  const orderId = url.searchParams.get('orderId') ?? '';
  if (!/^ord_[a-z0-9]+$/i.test(orderId)) return json({ error: 'Unknown order.' }, 404);

  const db = await getDb();
  if (!db) return json({ error: 'Order history needs the site database.' }, 503);

  const order = await db
    .prepare('SELECT id FROM orders WHERE id = ? AND lower(email) = ?')
    .bind(orderId, session.email)
    .first<{ id: string }>();
  if (!order) return json({ error: 'Unknown order.' }, 404);

  const rows = await db
    .prepare('SELECT variant_id, quantity, meta_json FROM order_items WHERE order_id = ?')
    .bind(orderId)
    .all<ItemRow>();

  const lines = (rows.results ?? []).flatMap((row) => {
    if (!row.variant_id || row.quantity < 1) return [];
    let meta: { designId?: string; size?: string; printPositions?: number; positions?: string } = {};
    if (row.meta_json) {
      try {
        meta = JSON.parse(row.meta_json) as typeof meta;
      } catch {
        meta = {};
      }
    }
    return [
      {
        variantId: row.variant_id,
        quantity: row.quantity,
        designId: meta.designId || undefined,
        size: meta.size || undefined,
        printPositions: meta.printPositions,
        positions: meta.positions,
      },
    ];
  });

  return json({ lines });
};
