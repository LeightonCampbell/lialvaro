import type { APIRoute } from 'astro';
import { getVariantById, isVariantId } from '../../lib/catalog';
import { getStudioConfig, isStudioTee, teeQtyMax, teeUnitCents } from '../../lib/design-studio';
import { getDb } from '../../lib/db';
import { getAppEnv } from '../../lib/env';
import { getStripe } from '../../lib/stripe-client';
import { getPricingConfig } from '../../lib/pricing';
import { markedUpCents, markupBpsFor } from '../../lib/stores';

export const prerender = false;

type CartItem = {
  variantId?: unknown;
  id?: unknown;
  qty?: unknown;
  quantity?: unknown;
  designId?: unknown;
  size?: unknown;
  studioPrice?: unknown;
  printPositions?: unknown;
  positions?: unknown;
  storeSlug?: unknown;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    let payload: { items?: CartItem[]; sameDayRequested?: boolean };
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) return json({ error: 'Cart is empty' }, 400);

    const storedPositions = new Map<string, number>();
    const db = await getDb();
    const normalized = [];
    for (const item of items) {
      const variantId = String(item.variantId ?? item.id ?? '');
      if (!isVariantId(variantId)) throw new Error(`Unknown variant: ${variantId}`);
      const qty = Number(item.qty ?? item.quantity);
      if (!Number.isFinite(qty) || qty < 1) throw new Error('Invalid quantity.');
      const variant = getVariantById(variantId)!;
      const size = typeof item.size === 'string' ? item.size.trim() : '';
      const designId = item.designId ? String(item.designId) : '';
      const studioProduct = getStudioConfig().products.find((product) => product.variantId === variantId);
      const studioTee = Boolean(designId) && isStudioTee(studioProduct);
      let printPositions = Math.max(1, Math.min(3, Number(item.printPositions) || 1));
      if (studioTee && designId && db && !storedPositions.has(designId)) {
        const row = await db
          .prepare('SELECT meta_json FROM designs WHERE id = ?')
          .bind(designId)
          .first<{ meta_json: string }>();
        let stored = 0;
        if (row?.meta_json) {
          try {
            stored = Number((JSON.parse(row.meta_json) as { printPositions?: number }).printPositions) || 0;
          } catch {
            stored = 0;
          }
        }
        if (stored >= 1) storedPositions.set(designId, stored);
      }
      const fromDesign = designId ? storedPositions.get(designId) : undefined;
      if (fromDesign) printPositions = fromDesign;
      const positions = typeof item.positions === 'string' ? item.positions.slice(0, 80) : '';
      const storeSlug = typeof item.storeSlug === 'string' ? item.storeSlug.slice(0, 80) : '';
      normalized.push({
        variant,
        variantId,
        qty,
        size,
        designId,
        studioTee,
        printPositions,
        positions,
        studioProduct,
        storeSlug,
      });
    }
    const teeTotals = new Map<string, number>();
    for (const item of normalized) {
      if (!item.studioTee || !item.designId) continue;
      teeTotals.set(item.designId, (teeTotals.get(item.designId) ?? 0) + item.qty);
    }
    const lineItems = normalized.map((item) => {
      const teeTotal = item.designId ? (teeTotals.get(item.designId) ?? item.qty) : item.qty;
      const maxQty = item.studioTee ? teeQtyMax(item.studioProduct) : 20;
      const quantity = Math.max(1, Math.min(item.qty, maxQty));
      const unit = item.studioTee
        ? teeUnitCents({ totalPieces: teeTotal, size: item.size, printPositions: item.printPositions })
        : markedUpCents(
            item.variant.retailPriceCents,
            markupBpsFor(item.storeSlug, item.variant.product.vendorId),
          );
      const positionNote = item.studioTee && item.printPositions >= 2 ? ` · ${item.printPositions} print positions` : '';
      return {
        price_data: {
          currency: 'usd' as const,
          product_data: {
            name: item.size
              ? `${item.variant.product.name} · Size ${item.size}${positionNote}`
              : item.variant.name,
            metadata: {
              variant_id: item.variant.id,
              lane: item.variant.lane,
              product_id: item.variant.product.id,
              vendor_id: item.variant.product.vendorId,
            },
          },
          unit_amount: unit,
        },
        quantity,
      };
    });
    const cartMeta = normalized.map((item) => {
      const teeTotal = item.designId ? (teeTotals.get(item.designId) ?? item.qty) : item.qty;
      const maxQty = item.studioTee ? teeQtyMax(item.studioProduct) : 20;
      const quantity = Math.max(1, Math.min(item.qty, maxQty));
      const unit = item.studioTee
        ? teeUnitCents({ totalPieces: teeTotal, size: item.size, printPositions: item.printPositions })
        : markedUpCents(
            item.variant.retailPriceCents,
            markupBpsFor(item.storeSlug, item.variant.product.vendorId),
          );
      return {
        variantId: item.variantId,
        quantity,
        designId: item.designId || undefined,
        size: item.size || undefined,
        unitPriceCents: unit,
        printPositions: item.studioTee ? item.printPositions : undefined,
        positions: item.positions || undefined,
        storeSlug: item.storeSlug || undefined,
      };
    });

    const env = await getAppEnv();
    if (!env.STRIPE_SECRET_KEY) {
      return json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' }, 503);
    }

    const pricing = getPricingConfig();
    const stripe = getStripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${url.origin}/order-confirmed/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/cart/`,
      shipping_address_collection: { allowed_countries: ['US'] },
      automatic_tax: pricing.tax.stripe_automatic_tax ? { enabled: true } : undefined,
      metadata: {
        same_day_requested: payload.sameDayRequested ? '1' : '0',
        cart: JSON.stringify(cartMeta),
      },
    });

    return json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not start checkout.';
    return json({ error: message }, 500);
  }
};
