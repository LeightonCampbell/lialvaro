import type { APIRoute } from 'astro';
import { allowMagicRequest, createMagicToken, normalizeEmail, safeNextPath } from '../../../lib/auth';
import { sendCustomerEmail } from '../../../lib/email';
import { allowAction, clientAddress } from '../../../lib/rate-limit';
import { turnstileError } from '../../../lib/turnstile';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  let body: { email?: string; next?: string; turnstileToken?: string };
  try {
    body = (await request.json()) as { email?: string; next?: string; turnstileToken?: string };
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const email = normalizeEmail(String(body.email ?? ''));
  if (!email) return json({ error: 'Enter a valid email address.' }, 400);
  const testHook = import.meta.env.DEV && request.headers.get('x-lialvaro-test') === '1';
  if (!testHook) {
    if (!allowAction(`magic:${clientAddress(request)}`, 10, 60 * 60 * 1000)) {
      return json({ error: 'Too many sign-in emails. Try again later.' }, 429);
    }
    if (!allowMagicRequest(email)) return json({ error: 'Too many sign-in emails. Try again later.' }, 429);
    const human = await turnstileError(request, String(body.turnstileToken ?? ''));
    if (human) return json({ error: human }, human.includes('not configured') ? 503 : 400);
  }

  const token = await createMagicToken(email);
  if (!token) return json({ error: 'Sign-in is not configured. Set AUTH_SECRET.' }, 503);

  const next = safeNextPath(body.next);
  const link = new URL('/account/', url.origin);
  link.searchParams.set('token', token);
  if (next !== '/account/') link.searchParams.set('next', next);

  if (testHook) {
    return json({ ok: true, sent: false, devLink: link.toString() });
  }

  const sent = await sendCustomerEmail({
    to: email,
    subject: 'Your LiAlvaro sign-in link',
    text: `Use this link to sign in. It expires in 20 minutes.\n\n${link.toString()}\n\nIf you did not ask for this, you can ignore the email.`,
  });

  if (!sent && !import.meta.env.DEV) {
    return json({ error: 'Email is not configured yet. Set RESEND_API_KEY.' }, 503);
  }

  return json({
    ok: true,
    sent,
    devLink: !sent && import.meta.env.DEV ? link.toString() : undefined,
  });
};
