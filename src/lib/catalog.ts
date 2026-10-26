import seed from '../data/catalog.seed.json';
import { formatUsd, vendorCutCents } from './pricing';

export type Lane = 'local' | 'broker';

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  email?: string | null;
};

export type CatalogVariant = {
  id: string;
  sku?: string;
  name: string;
  size?: string | null;
  color?: string | null;
  lane: Lane;
  blankCostCents: number;
  retailPriceCents: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  vendorId: string;
  vendor: Vendor;
  vendorCutBps: number;
  blankCostCents: number;
  imageUrl?: string | null;
  variants: CatalogVariant[];
};

function mapSeed(): { vendors: Vendor[]; products: CatalogProduct[] } {
  const vendors: Vendor[] = seed.vendors.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    email: v.email ?? null,
  }));
  const byId = new Map(vendors.map((v) => [v.id, v]));

  const products: CatalogProduct[] = seed.products.map((p) => {
    const vendor = byId.get(p.vendorId);
    if (!vendor) throw new Error(`Seed catalog missing vendor ${p.vendorId} for ${p.id}`);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      vendorId: p.vendorId,
      vendor,
      vendorCutBps: p.vendorCutBps,
      blankCostCents: p.blankCostCents,
      imageUrl: p.imageUrl,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        size: v.size,
        color: v.color,
        lane: (v.lane as Lane) || 'local',
        blankCostCents: v.blankCostCents,
        retailPriceCents: v.retailPriceCents,
      })),
    };
  });

  return { vendors, products };
}

let cache: { vendors: Vendor[]; products: CatalogProduct[] } | null = null;

function ensure() {
  if (!cache) cache = mapSeed();
  return cache;
}

export function listVendors(): Vendor[] {
  return ensure().vendors;
}

export function listProducts(category?: string): CatalogProduct[] {
  const products = ensure().products;
  if (!category || category === 'all') return products;
  return products.filter((p) => p.category === category);
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

export function lineVendorCutCents(product: CatalogProduct, retailLineCents: number): number {
  return vendorCutCents(retailLineCents, product.vendorCutBps);
}
