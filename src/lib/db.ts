import { getAppEnv } from './env';

export async function getDb(): Promise<D1Database | null> {
  const env = await getAppEnv();
  return env.DB ?? null;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

export async function recordWebhookEvent(
  db: D1Database,
  source: string,
  eventId: string,
): Promise<boolean> {
  try {
    await db
      .prepare('INSERT INTO webhook_events (id, source, event_id) VALUES (?, ?, ?)')
      .bind(newId('wh'), source, eventId)
      .run();
    return true;
  } catch {
    // UNIQUE(source, event_id) — already processed
    return false;
  }
}

export async function insertAuditEvent(
  db: D1Database,
  entityType: string,
  entityId: string,
  kind: string,
  payload?: unknown,
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO events (id, entity_type, entity_id, kind, payload_json) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(newId('evt'), entityType, entityId, kind, payload ? JSON.stringify(payload) : null)
    .run();
}
