import type { APIRoute } from 'astro';
import { getAppEnv } from '../../lib/env';
import { createPrintfulProvider } from '../../lib/provider/printful';
import { retailFromVendorCost } from '../../lib/pricing';
import { getDb, newId } from '../../lib/db';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Sync a small curated set of Printful catalog products into D1.
 * Protected by shared secret header when CATALOG_SYNC_SECRET is set.
 * Page renders never call Printful — only this job (or wrangler cron) does.
 */
export const POST: APIRoute = async ({ request }) => {
  const env = await getAppEnv();
  const { readSecret } = await import('../../lib/env');
  const syncSecret = await readSecret('CATALOG_SYNC_SECRET');
  if (syncSecret) {
    const header = request.headers.get('x-catalog-sync-secret');
    if (header !== syncSecret) return json({ error: 'Unauthorized' }, 401);
  }

  if (!env.PRINTFUL_API_TOKEN) {
    return json({ error: 'PRINTFUL_API_TOKEN not configured. Seed catalog remains active.' }, 503);
  }

  const db = await getDb();
  if (!db) return json({ error: 'D1 binding DB not configured.' }, 503);

  const body = (await request.json().catch(() => ({}))) as { productIds?: Array<string | number> };
  const productIds = body.productIds?.length ? body.productIds : [71, 146, 206];

  const provider = createPrintfulProvider({
    token: env.PRINTFUL_API_TOKEN,
    storeId: env.PRINTFUL_STORE_ID,
  });

  const synced: string[] = [];
  for (const pid of productIds) {
    const productRes = (await provider.listProducts({ limit: 1 })) as { data?: unknown[] };
    void productRes;
    const detail = (await fetch(`https://api.printful.com/v2/catalog-products/${pid}`, {
      headers: {
        Authorization: `Bearer ${env.PRINTFUL_API_TOKEN}`,
        ...(env.PRINTFUL_STORE_ID ? { 'X-PF-Store-Id': env.PRINTFUL_STORE_ID } : {}),
      },
    }).then((r) => r.json())) as { data?: { id: number; name: string; description?: string; image?: string } };

    const variantsRes = (await provider.getVariants(pid)) as {
      data?: Array<{ id: number; name?: string; size?: string; color?: string; price?: string }>;
    };

    const p = detail.data;
    if (!p) continue;
    const productId = `pf_${p.id}`;
    const slug = String(p.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await db
      .prepare(
        `INSERT INTO products (id, slug, name, description, category, provider, provider_product_id, image_url, active)
         VALUES (?, ?, ?, ?, 'apparel', 'printful', ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, image_url=excluded.image_url, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(productId, slug || productId, p.name, p.description ?? '', String(p.id), p.image ?? null)
      .run();

    for (const v of variantsRes.data ?? []) {
      const vendor = Math.round(Number(v.price ?? 0) * 100) || 0;
      const retail = retailFromVendorCost(vendor);
      await db
        .prepare(
          `INSERT INTO variants (id, product_id, sku, name, size, color, provider_variant_id, lane, vendor_cost_cents, retail_price_cents, currency, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pod', ?, ?, 'usd', 1)
           ON CONFLICT(id) DO UPDATE SET vendor_cost_cents=excluded.vendor_cost_cents, retail_price_cents=excluded.retail_price_cents, name=excluded.name`,
        )
        .bind(
          `pfv_${v.id}`,
          productId,
          `PF-${v.id}`,
          v.name ?? `${p.name} ${v.size ?? ''} ${v.color ?? ''}`.trim(),
          v.size ?? null,
          v.color ?? null,
          String(v.id),
          vendor,
          retail,
        )
        .run();
    }
    synced.push(productId);
  }

  return json({ ok: true, synced, note: newId('sync') });
};
