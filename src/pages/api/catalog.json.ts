import type { APIRoute } from 'astro';
import { listProducts } from '../../lib/catalog';
import { listStores } from '../../lib/stores';

export const prerender = true;

export const GET: APIRoute = async () => {
  const products = listProducts();
  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      retailPriceCents: v.retailPriceCents,
      lane: v.lane,
      product: { name: p.name, slug: p.slug, vendorName: p.vendor.name, vendorId: p.vendorId },
    })),
  );
  const stores = listStores().map((store) => ({
    slug: store.slug,
    vendorId: store.vendorId,
    markupBps: store.markupBps,
  }));
  return new Response(JSON.stringify({ products, variants, stores }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
