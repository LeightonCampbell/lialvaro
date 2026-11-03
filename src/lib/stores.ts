import stores from '../data/stores.json';

export type ClientStore = {
  slug: string;
  name: string;
  vendorId: string;
  markupBps: number;
  visibility: 'public' | 'unlisted';
};

function allStores(): ClientStore[] {
  return stores.map((store) => ({
    slug: store.slug,
    name: store.name,
    vendorId: store.vendorId,
    markupBps: store.markupBps,
    visibility: store.visibility === 'unlisted' ? 'unlisted' : 'public',
  }));
}

export function listStores(): ClientStore[] {
  return allStores();
}

export function listPublicStores(): ClientStore[] {
  return allStores().filter((store) => store.visibility === 'public');
}

export function getStore(slug: string): ClientStore | undefined {
  return allStores().find((store) => store.slug === slug);
}

export function markedUpCents(cents: number, markupBps: number): number {
  if (!Number.isFinite(cents) || !Number.isFinite(markupBps) || markupBps <= 0) return cents;
  return Math.round((cents * (10000 + markupBps)) / 10000);
}

/** Markup applies only when the store exists and sells that vendor's designs. */
export function markupBpsFor(storeSlug: string | undefined, vendorId: string): number {
  if (!storeSlug) return 0;
  const store = getStore(storeSlug);
  if (!store || store.vendorId !== vendorId) return 0;
  return Math.max(0, store.markupBps);
}
