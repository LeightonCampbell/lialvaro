import type { APIRoute } from 'astro';
import { listProducts } from '../../lib/catalog';

export const prerender = true;

export const GET: APIRoute = async () => {
  const products = listProducts();
  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      retailPriceCents: v.retailPriceCents,
      lane: v.lane,
      product: { name: p.name, slug: p.slug },
    })),
  );
  return new Response(JSON.stringify({ products, variants }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
