import type { APIRoute } from 'astro';
import { sendOwnerEmail } from '../../lib/email';
import { allowAction, clientAddress } from '../../lib/rate-limit';
import { turnstileError } from '../../lib/turnstile';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function text(form: FormData, key: string, max = 500): string {
  return String(form.get(key) ?? '').trim().slice(0, max);
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Send the contact form as submitted.' }, 400);
  }

  if (text(form, '_gotcha')) return json({ ok: true });
  if (!allowAction(`contact:${clientAddress(request)}`, 8, 60 * 60 * 1000)) {
    return json({ error: 'Too many messages. Try again later or call us.' }, 429);
  }

  const name = text(form, 'name', 120);
  const email = text(form, 'email', 200).toLowerCase();
  const phone = text(form, 'phone', 40);
  const message = text(form, 'message', 4000);

  if (!name) return json({ error: 'Name is required.' }, 400);
  if (!email.includes('@') || !email.includes('.')) return json({ error: 'Enter a valid email address.' }, 400);
  if (!message) return json({ error: 'Tell us a bit about your project.' }, 400);

  const human = await turnstileError(request, text(form, 'cf-turnstile-response', 2048));
  if (human) return json({ error: human }, human.includes('not configured') ? 503 : 400);

  const sent = await sendOwnerEmail({
    subject: `Contact form — ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '(not provided)'}`,
      '',
      message,
    ].join('\n'),
  });

  if (!sent) {
    return json({ error: 'Could not send your message right now. Call us and we will help.' }, 503);
  }

  return json({ ok: true });
};
