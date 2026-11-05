import { getDb, newId } from './db';
import { readSecret } from './env';

export const SESSION_COOKIE = 'lialvaro_session';

type TokenPurpose = 'magic' | 'session';

type TokenPayload = {
  email: string;
  exp: number;
  purpose: TokenPurpose;
  jti: string;
};

const DEV_SECRET = 'dev-only-lialvaro-auth-not-for-production';

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 200) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/account/';
  if (value.includes('://')) return '/account/';
  return value;
}

async function signingKey(): Promise<CryptoKey | null> {
  const raw = (await readSecret('AUTH_SECRET')) ?? (import.meta.env.DEV ? DEV_SECRET : undefined);
  if (!raw) return null;
  return crypto.subtle.importKey('raw', new TextEncoder().encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
}

async function signPayload(payload: TokenPayload): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const body = bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${bytesToB64url(new Uint8Array(sig))}`;
}

async function readPayload(token: string, purpose: TokenPurpose): Promise<TokenPayload | null> {
  const key = await signingKey();
  if (!key) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = bytesToB64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))));
  if (!safeEqual(expected, sig)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as TokenPayload;
    if (payload.purpose !== purpose || typeof payload.email !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    const email = normalizeEmail(payload.email);
    if (!email) return null;
    return { ...payload, email };
  } catch {
    return null;
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const recentRequests = new Map<string, number[]>();

export function allowMagicRequest(email: string): boolean {
  const now = Date.now();
  const recent = (recentRequests.get(email) ?? []).filter((at) => now - at < 60 * 60 * 1000);
  if (recent.length >= 5) {
    recentRequests.set(email, recent);
    return false;
  }
  recent.push(now);
  recentRequests.set(email, recent);
  return true;
}

export async function createMagicToken(email: string): Promise<string | null> {
  const token = await signPayload({
    email,
    purpose: 'magic',
    exp: Date.now() + 20 * 60 * 1000,
    jti: newId('ml'),
  });
  if (!token) return null;
  const db = await getDb();
  if (db) {
    try {
      await db
        .prepare('INSERT INTO magic_links (id, email, token_hash, expires_at) VALUES (?, ?, ?, ?)')
        .bind(newId('ml'), email, await sha256Hex(token), new Date(Date.now() + 20 * 60 * 1000).toISOString())
        .run();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.includes('no such table') || import.meta.env.PROD) throw err;
    }
  }
  return token;
}

export async function consumeMagicToken(token: string): Promise<string | null> {
  const payload = await readPayload(token, 'magic');
  if (!payload) return null;
  const db = await getDb();
  if (db) {
    try {
      const hash = await sha256Hex(token);
      const row = await db
        .prepare('SELECT id, used_at FROM magic_links WHERE token_hash = ?')
        .bind(hash)
        .first<{ id: string; used_at: string | null }>();
      if (!row || row.used_at) return null;
      await db
        .prepare('UPDATE magic_links SET used_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), row.id)
        .run();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.includes('no such table') || import.meta.env.PROD) throw err;
    }
  }
  return payload.email;
}

export async function createSessionToken(email: string): Promise<string | null> {
  return signPayload({
    email,
    purpose: 'session',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    jti: newId('ses'),
  });
}

export async function readSession(token: string | undefined): Promise<{ email: string } | null> {
  if (!token) return null;
  const payload = await readPayload(token, 'session');
  return payload ? { email: payload.email } : null;
}

export async function isOwnerEmail(email: string): Promise<boolean> {
  const owner = (await readSecret('ORDER_NOTIFICATION_EMAIL'))?.toLowerCase();
  return Boolean(owner && owner === email.toLowerCase());
}

export async function getOrCreateUser(email: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  if (existing) return existing.id;
  const id = newId('usr');
  await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email).run();
  return id;
}
