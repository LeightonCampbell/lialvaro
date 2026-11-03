import { readSecret } from './env';

export async function turnstileError(request: Request, token: string): Promise<string | null> {
  const secret = await readSecret('TURNSTILE_SECRET_KEY');
  if (!secret) {
    if (import.meta.env.DEV) return null;
    return 'Quote protection is not configured yet. Call us and we will take the request.';
  }
  if (!token) return 'Confirm you are a person, then try again.';

  const body = new URLSearchParams({ secret, response: token });
  const remote = request.headers.get('cf-connecting-ip');
  if (remote) body.set('remoteip', remote);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return 'Could not verify that submission. Try again.';
  const data = (await res.json()) as { success?: boolean };
  if (!data.success) return 'Confirm you are a person, then try again.';
  return null;
}
