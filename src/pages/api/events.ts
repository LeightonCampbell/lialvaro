import type { APIRoute } from 'astro';
import { getDb, insertAuditEvent, newId } from '../../lib/db';

export const prerender = false;

const KINDS = new Set(['quote_started', 'quote_step_N', 'quote_submitted']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { kind?: string; step?: unknown; source?: unknown };
  try {
    body = (await request.json()) as { kind?: string; step?: unknown; source?: unknown };
  } catch {
    return json({ ok: false }, 400);
  }
  const kind = String(body.kind ?? '');
  if (!KINDS.has(kind)) return json({ ok: false }, 400);

  const db = await getDb();
  if (!db) return json({ ok: true, stored: false });

  const step = Number(body.step);
  await insertAuditEvent(db, 'quote', newId('qev'), kind, {
    step: Number.isFinite(step) ? step : undefined,
    source: typeof body.source === 'string' ? body.source.slice(0, 40) : undefined,
  });
  return json({ ok: true, stored: true });
};
