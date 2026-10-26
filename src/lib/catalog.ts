import seed from '../data/catalog.seed.json';
import { formatUsd } from './pricing';

export type Lane = 'local' | 'pod' | 'broker';

export type CatalogVariant = {
  id: string;
  sku?: string;
  name: string;
  size?: string | null;
  color?: string | null;
  providerVariantId?: string | null;
  lane: Lane;
  vendorCostCents: number;
  retailPriceCents: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  provider?: string | null;
  providerProductId?: string | null;
  imageUrl?: string | null;
  variants: CatalogVariant[];
};

function mapSeed(): CatalogProduct[] {
  return seed.products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    provider: p.provider,
    providerProductId: p.providerProductId,
    imageUrl: p.imageUrl,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      size: v.size,
      color: v.color,
      providerVariantId: v.providerVariantId,
      lane: v.lane as Lane,
      vendorCostCents: v.vendorCostCents,
      retailPriceCents: v.retailPriceCents,
    })),
  }));
}

let cache: CatalogProduct[] | null = null;

export function listProducts(category?: string): CatalogProduct[] {
  if (!cache) cache = mapSeed();
  if (!category || category === 'all') return cache;
  return cache.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return listProducts().find((p) => p.slug === slug);
}

export function getVariantById(id: string): (CatalogVariant & { product: CatalogProduct }) | undefined {
  for (const product of listProducts()) {
    const variant = product.variants.find((v) => v.id === id);
    if (variant) return { ...variant, product };
  }
  return undefined;
}

export function isVariantId(id: string): boolean {
  return Boolean(getVariantById(id));
}

export function productCardPrice(product: CatalogProduct): string {
  const cents = Math.min(...product.variants.map((v) => v.retailPriceCents));
  return formatUsd(cents);
}
