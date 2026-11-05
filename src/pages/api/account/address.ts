import type { APIRoute } from 'astro';
import { getOrCreateUser, readSession, SESSION_COOKIE } from '../../../lib/auth';
import { getDb, newId } from '../../../lib/db';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function field(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await readSession(cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: 'Sign in required.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const line1 = field(body.line1, 120);
  const city = field(body.city, 80);
  const region = field(body.region, 40);
  const postal = field(body.postal, 20);
  if (!line1 || !city || !region || !postal) return json({ error: 'Address, city, state, and ZIP are required.' }, 400);

  const db = await getDb();
  if (!db) return json({ error: 'Saved addresses need the site database.' }, 503);
  const userId = await getOrCreateUser(session.email);
  if (!userId) return json({ error: 'Could not save the address.' }, 500);

  await db
    .prepare(
      `INSERT INTO addresses (id, user_id, label, line1, line2, city, region, postal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(newId('addr'), userId, field(body.label, 40) || null, line1, field(body.line2, 120) || null, city, region, postal)
    .run();

  return json({ ok: true });
};
