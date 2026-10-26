import pricing from '../data/pricing.json';

export type PricingConfig = typeof pricing;

export function getPricingConfig(): PricingConfig {
  return pricing;
}

/** Retail cents from vendor cost using owner markup rules. */
export function retailFromVendorCost(vendorCostCents: number, percent = pricing.markup.percent): number {
  if (!Number.isFinite(vendorCostCents) || vendorCostCents < 0) return 0;
  const retail = vendorCostCents * (1 + percent / 100);
  return Math.ceil(retail);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function marginBps(vendorCostCents: number, retailPriceCents: number): number {
  if (retailPriceCents <= 0) return 0;
  return Math.round(((retailPriceCents - vendorCostCents) / retailPriceCents) * 10000);
}
