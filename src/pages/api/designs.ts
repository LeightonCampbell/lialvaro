import type { APIRoute } from 'astro';
import { getDb, newId } from '../../lib/db';
import {
  designedSideKeys,
  getStudioProduct,
  isStudioTee,
  studioUnitPriceCents,
  teeQtyMax,
  teeUnitCents,
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
  sizes?: Record<string, number>;
  sides?: Record<string, unknown>;
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
  const catalogCents = studioUnitPriceCents(productId);
  if (!catalogCents) return json({ error: 'Studio product is missing retail pricing.' }, 500);

  const sides = body.sides && typeof body.sides === 'object' ? body.sides : {};
  const positionKeys = designedSideKeys(sides);
  const printPositions = Math.max(positionKeys.length, objectCount > 0 ? 1 : 0);
  const sizes = body.sizes && typeof body.sizes === 'object' ? body.sizes : {};
  const totalPieces = Object.values(sizes).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  if (totalPieces > teeQtyMax(product)) {
    return json({ error: `Studio orders are limited to ${teeQtyMax(product)} pieces.` }, 400);
  }
  const pricesBySize: Record<string, number> = {};
  for (const [sizeName, qty] of Object.entries(sizes)) {
    if ((Number(qty) || 0) < 1) continue;
    pricesBySize[sizeName] = isStudioTee(product)
      ? teeUnitCents({ totalPieces, size: sizeName, printPositions })
      : catalogCents;
  }
  const unitPriceCents = isStudioTee(product)
    ? teeUnitCents({ totalPieces: Math.max(1, totalPieces), size: '', printPositions })
    : catalogCents;

  const designId = newId('dsn');
  const meta = {
    productId,
    colorId: body.colorId ?? product.colors[0]?.id,
    side,
    canvasJson: body.canvasJson ?? null,
    preflightWarnings: body.preflightWarnings ?? [],
    unitPriceCents,
    guestId: body.guestId ?? null,
    sizes,
    sides,
    printPositions,
    positions: positionKeys,
    pricesBySize,
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
    printPositions,
    positions: positionKeys,
    pricesBySize,
    warnings: [...check.warnings, ...(body.preflightWarnings ?? [])],
    persisted: Boolean(db),
  });
};
