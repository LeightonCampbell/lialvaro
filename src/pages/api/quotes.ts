import type { APIRoute } from 'astro';
import { getDb, insertAuditEvent, newId } from '../../lib/db';
import { sendOwnerEmail, type EmailAttachment } from '../../lib/email';
import { quotePublicToken } from '../../lib/quotes';
import { allowAction, clientAddress } from '../../lib/rate-limit';
import { turnstileError } from '../../lib/turnstile';
import { uploadRejection } from '../../lib/uploads';

export const prerender = false;

const DESIGN_TYPES = ['Tops', 'Bottoms', 'Hats', 'Bags', 'Something Else'];
const MAX_FILES = 5;
/** Keep under Resend’s email size ceiling after base64 expansion. */
const MAX_ATTACH_BYTES = 20 * 1024 * 1024;

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function filesToAttachments(files: File[]): Promise<{
  attachments: EmailAttachment[];
  attachedNames: string[];
  skippedNames: string[];
}> {
  const attachments: EmailAttachment[] = [];
  const attachedNames: string[] = [];
  const skippedNames: string[] = [];
  let used = 0;

  for (const file of files) {
    if (used + file.size > MAX_ATTACH_BYTES) {
      skippedNames.push(file.name.slice(0, 180));
      continue;
    }
    const content = bytesToBase64(await file.arrayBuffer());
    attachments.push({
      filename: file.name.slice(0, 180) || 'design-file',
      content,
      content_type: file.type || undefined,
    });
    attachedNames.push(file.name.slice(0, 180));
    used += file.size;
  }

  return { attachments, attachedNames, skippedNames };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function text(form: FormData, key: string, max = 500): string {
  return String(form.get(key) ?? '').trim().slice(0, max);
}

export const POST: APIRoute = async ({ request, url }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Send the quote form as submitted.' }, 400);
  }

  if (text(form, '_gotcha')) return json({ ok: true });
  if (!allowAction(`quote:${clientAddress(request)}`, 8, 60 * 60 * 1000)) {
    return json({ error: 'Too many quote requests. Try again later or call us.' }, 429);
  }

  const firstName = text(form, 'first_name', 80);
  const lastName = text(form, 'last_name', 80);
  const phone = text(form, 'phone', 40);
  const email = text(form, 'email', 200).toLowerCase();
  const service = text(form, 'service', 80);
  const pieces = text(form, 'pieces', 10);
  const colors = text(form, 'colors', 40);
  const blanks = text(form, 'quote-providing-blanks', 8);
  const material = text(form, 'blank_material', 200);
  const notes = text(form, 'design_notes', 4000);
  const designTypes = form
    .getAll('quote-design-type')
    .map((value) => String(value))
    .filter((value) => DESIGN_TYPES.includes(value));

  if (!firstName || !lastName || !phone) return json({ error: 'Name and phone are required.' }, 400);
  if (!email.includes('@') || !email.includes('.')) return json({ error: 'Enter a valid email address.' }, 400);
  if (!designTypes.length) return json({ error: 'Choose at least one design type.' }, 400);
  const pieceCount = Number(pieces);
  if (!Number.isFinite(pieceCount) || pieceCount < 1) return json({ error: 'Enter how many pieces you need.' }, 400);
  if (blanks !== 'yes' && blanks !== 'no') return json({ error: 'Say whether you will provide the blanks.' }, 400);
  if (blanks === 'yes' && !material) return json({ error: 'Enter the material of your blanks.' }, 400);

  const files = form
    .getAll('design_files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_FILES);
  for (const file of files) {
    const rejection = await uploadRejection(file);
    if (rejection) return json({ error: rejection }, 400);
  }
  const human = await turnstileError(request, text(form, 'cf-turnstile-response', 2048));
  if (human) return json({ error: human }, human.includes('not configured') ? 503 : 400);

  const db = await getDb();
  if (!db) return json({ error: 'Quotes need the site database. Call us and we will take the request.' }, 503);

  const id = newId('quo');
  const token = quotePublicToken();
  const { attachments, attachedNames, skippedNames } = await filesToAttachments(files);
  const payload = {
    service,
    designTypes,
    pieces: pieceCount,
    colors,
    providingBlanks: blanks === 'yes',
    material,
    notes,
    files: files.map((file) => ({
      name: file.name.slice(0, 180),
      size: file.size,
      type: file.type,
      emailed: attachedNames.includes(file.name.slice(0, 180)),
    })),
    filesEmailed: attachedNames,
    filesSkippedForSize: skippedNames,
  };

  try {
    await db
      .prepare(
        `INSERT INTO quotes (
          id, email, name, phone, status, payload_json, public_token, updated_at
        ) VALUES (?, ?, ?, ?, 'open', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      )
      .bind(id, email, `${firstName} ${lastName}`, phone, JSON.stringify(payload), token)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('no such column') || message.includes('no such table')) {
      return json({ error: 'Quote storage is not ready yet. Call us and we will take the request.' }, 503);
    }
    throw err;
  }

  await insertAuditEvent(db, 'quote', id, 'quote_submitted', {
    email,
    service,
    filesAttached: attachedNames.length,
  });

  const page = new URL(`/quotes/${token}/`, url.origin).toString();
  const fileLines = (() => {
    if (!files.length) return ['No files attached.'];
    const lines = [
      attachedNames.length
        ? `Design files attached to this email (${attachedNames.length}): ${attachedNames.join(', ')}`
        : 'Design files were uploaded but could not be attached (size limit).',
    ];
    if (skippedNames.length) {
      lines.push(
        `Could not attach (too large for email): ${skippedNames.join(', ')}. Ask the customer to resend those files.`,
      );
    }
    return lines;
  })();

  const emailed = await sendOwnerEmail({
    subject: `New quote request — ${firstName} ${lastName}`,
    text: [
      `${firstName} ${lastName}`,
      email,
      phone,
      service ? `Service: ${service}` : 'Service: not chosen',
      `Design: ${designTypes.join(', ')}`,
      `Pieces: ${pieceCount}`,
      colors ? `Colors: ${colors}` : '',
      `Providing blanks: ${blanks === 'yes' ? 'yes' : 'no'}`,
      material ? `Material: ${material}` : '',
      notes ? `Notes: ${notes}` : '',
      ...fileLines,
      '',
      `Build the quote: ${url.origin}/admin/`,
      `Customer page: ${page}`,
    ]
      .filter(Boolean)
      .join('\n'),
    attachments,
  });

  return json({
    ok: true,
    emailed,
    filesAttached: attachedNames.length,
    filesSkipped: skippedNames.length,
  });
};
