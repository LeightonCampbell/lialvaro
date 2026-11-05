import studio from '../data/design-studio.json';
import { getVariantById } from './catalog';

export type StudioPlacement = {
  label: string;
  widthIn: number;
  heightIn: number;
  image?: string;
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

/** Shop blanks stay at 20. Studio tees use the quantity breaks through 300+. */
export const STUDIO_QTY_MAX = 20;
export const TEE_QTY_MAX = 999;

const TEE_TIERS: { max: number; cents: number; label: string }[] = [
  { max: 15, cents: 2400, label: '1–15' },
  { max: 30, cents: 2100, label: '16–30' },
  { max: 50, cents: 1800, label: '31–50' },
  { max: 99, cents: 1500, label: '51–99' },
  { max: 300, cents: 1200, label: '100–300' },
  { max: Number.POSITIVE_INFINITY, cents: 1000, label: '300+' },
];

export const TEE_BIG_SIZE_CENTS = 300;
export const TEE_SECOND_POSITION_CENTS = 700;

export function isStudioTee(product: { shape?: string } | undefined): boolean {
  return product?.shape === 'tee';
}

export function teeQtyMax(product: { shape?: string } | undefined): number {
  return isStudioTee(product) ? TEE_QTY_MAX : STUDIO_QTY_MAX;
}

/** 3XL, 4XL, and 5XL. */
export function isBigTeeSize(size: string): boolean {
  return /^(?:3|4|5)XL$/i.test(size.trim());
}

export function teeTier(totalPieces: number): { cents: number; label: string } {
  const qty = Math.max(1, Math.floor(totalPieces));
  return TEE_TIERS.find((tier) => qty <= tier.max) ?? TEE_TIERS[TEE_TIERS.length - 1];
}

export function teeUnitCents(input: { totalPieces: number; size: string; printPositions: number }): number {
  let cents = teeTier(input.totalPieces).cents;
  if (isBigTeeSize(input.size)) cents += TEE_BIG_SIZE_CENTS;
  if (input.printPositions >= 2) cents += TEE_SECOND_POSITION_CENTS;
  return cents;
}

export function sideObjectCount(raw: unknown): number {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return 0;
    }
  }
  if (!value || typeof value !== 'object') return 0;
  const objects = (value as { objects?: unknown }).objects;
  return Array.isArray(objects) ? objects.length : 0;
}

export function designedSideKeys(sides: Record<string, unknown> | null | undefined): string[] {
  if (!sides) return [];
  return Object.keys(sides).filter((key) => sideObjectCount(sides[key]) > 0);
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
