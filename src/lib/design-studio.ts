import studio from '../data/design-studio.json';
import { getVariantById } from './catalog';

export type StudioPlacement = {
  label: string;
  widthIn: number;
  heightIn: number;
  mockup: { xPct: number; yPct: number; wPct: number; hPct: number };
};

export type StudioProduct = (typeof studio.products)[number];

export function getStudioConfig() {
  return studio;
}

export function getStudioProduct(id: string): StudioProduct | undefined {
  return studio.products.find((p) => p.id === id);
}

export function printBoxPx(placement: StudioPlacement, dpi = studio.dpi) {
  return {
    width: Math.round(placement.widthIn * dpi),
    height: Math.round(placement.heightIn * dpi),
  };
}

export function displayBoxPx(placement: StudioPlacement, scale = studio.displayScale, dpi = studio.dpi) {
  const full = printBoxPx(placement, dpi);
  return {
    width: Math.max(120, Math.round(full.width * scale)),
    height: Math.max(80, Math.round(full.height * scale)),
  };
}

/** Effective DPI if artwork rendered at `naturalWidth` into a box `boxWidthIn` inches wide. */
export function effectiveDpi(naturalWidth: number, boxWidthIn: number): number {
  if (!boxWidthIn || boxWidthIn <= 0) return 0;
  return naturalWidth / boxWidthIn;
}

export function studioUnitPriceCents(productId: string): number {
  const product = getStudioProduct(productId);
  if (!product) return 0;
  const variant = getVariantById(product.variantId);
  return variant?.retailPriceCents ?? 0;
}

export function validateStudioExport(input: {
  productId: string;
  side: string;
  attestation: boolean;
  canvasObjectCount: number;
  uploadBytes?: number;
}): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const product = getStudioProduct(input.productId);
  if (!product) errors.push('Unknown studio product.');
  if (!input.attestation) errors.push('IP attestation is required.');
  const placements = product?.placements as Record<string, unknown> | undefined;
  if (!placements?.[input.side]) {
    errors.push('Unknown print placement.');
  }
  if (input.canvasObjectCount < 1) errors.push('Add artwork or text before exporting.');
  if (input.uploadBytes && input.uploadBytes > studio.maxUploadBytes) {
    errors.push('File exceeds the 8MB upload limit.');
  }
  return { ok: errors.length === 0, errors, warnings };
}
