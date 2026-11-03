import type { APIRoute } from 'astro';
import { getOrCreateUser, readSession, SESSION_COOKIE } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await readSession(cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: 'Sign in required.' }, 401);

  let body: { guestId?: string };
  try {
    body = (await request.json()) as { guestId?: string };
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const guestId = String(body.guestId ?? '');
  if (!/^gst_[a-z0-9]+$/i.test(guestId)) return json({ ok: true, attached: 0 });

  const db = await getDb();
  if (!db) return json({ ok: true, attached: 0, persisted: false });
  const userId = await getOrCreateUser(session.email);
  if (!userId) return json({ error: 'Could not attach designs.' }, 500);

  const result = await db
    .prepare(
      `UPDATE designs SET user_id = ?
       WHERE user_id IS NULL AND json_extract(meta_json, '$.guestId') = ?`,
    )
    .bind(userId, guestId)
    .run();

  const changes =
    result.meta && typeof result.meta === 'object' && 'changes' in result.meta
      ? Number((result.meta as { changes?: number }).changes ?? 0)
      : 0;
  return json({ ok: true, attached: changes, persisted: true });
};
