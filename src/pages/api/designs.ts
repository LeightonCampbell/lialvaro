import type { APIRoute } from 'astro';
import { getDb, newId } from '../../lib/db';
import {
  getStudioProduct,
  studioUnitPriceCents,
  validateStudioExport,
} from '../../lib/design-studio';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Body = {
  productId?: string;
  colorId?: string;
  side?: string;
  canvasJson?: unknown;
  objectCount?: number;
  attestation?: boolean;
  guestId?: string;
  preflightWarnings?: string[];
};

export const POST: APIRoute = async ({ request }) => {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const productId = String(body.productId ?? '');
  const side = String(body.side ?? 'front');
  const attestation = Boolean(body.attestation);
  const objectCount = Number(body.objectCount ?? 0);
  const check = validateStudioExport({
    productId,
    side,
    attestation,
    canvasObjectCount: objectCount,
  });
  if (!check.ok) return json({ error: check.errors.join(' '), errors: check.errors }, 400);

  const product = getStudioProduct(productId)!;
  const unitPriceCents = studioUnitPriceCents(productId);
  if (!unitPriceCents) return json({ error: 'Studio product is missing retail pricing.' }, 500);

  const designId = newId('dsn');
  const meta = {
    productId,
    colorId: body.colorId ?? product.colors[0]?.id,
    side,
    canvasJson: body.canvasJson ?? null,
    preflightWarnings: body.preflightWarnings ?? [],
    unitPriceCents,
    guestId: body.guestId ?? null,
    attestation: true,
    createdAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (db) {
    // product_id FK points at catalog products; studio blanks map via meta.variantId.
    await db
      .prepare(
        `INSERT INTO designs (id, user_id, product_id, status, r2_key, meta_json)
         VALUES (?, NULL, NULL, 'ready', NULL, ?)`,
      )
      .bind(designId, JSON.stringify(meta))
      .run();
  }

  return json({
    designId,
    variantId: product.variantId,
    unitPriceCents,
    warnings: [...check.warnings, ...(body.preflightWarnings ?? [])],
    persisted: Boolean(db),
  });
};
