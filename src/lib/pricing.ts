import pricing from '../data/pricing.json';

export type PricingConfig = typeof pricing;

export function getPricingConfig(): PricingConfig {
  return pricing;
}

export function vendorCutCents(retailLineCents: number, bps = pricing.vendorCut.defaultBps): number {
  if (!Number.isFinite(retailLineCents) || retailLineCents <= 0) return 0;
  return Math.round((retailLineCents * bps) / 10000);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/** Internal margin after blank cost + vendor cut (not shown to customers). */
export function ownerMarginCents(opts: {
  retailLineCents: number;
  blankCostCents: number;
  quantity: number;
  vendorCutBps: number;
}): number {
  const cut = vendorCutCents(opts.retailLineCents, opts.vendorCutBps);
  const blanks = opts.blankCostCents * opts.quantity;
  return opts.retailLineCents - cut - blanks;
}
