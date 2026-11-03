export type CartLine = {
  variantId: string;
  quantity: number;
  designId?: string;
  size?: string;
  /** Set for Design Studio tees so the cart can reprice quantity breaks. */
  studioPrice?: 'tee';
  printPositions?: number;
  positions?: string;
  /** Client store slug. Markup is recomputed on the server from the store record. */
  storeSlug?: string;
};

const SHOP_QTY_MAX = 20;
const TEE_QTY_MAX = 999;

function qtyCap(line: { studioPrice?: string }): number {
  return line.studioPrice === 'tee' ? TEE_QTY_MAX : SHOP_QTY_MAX;
}

const KEY = 'lialvaro_cart_v1';

export function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((l) => l.variantId && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent('lialvaro:cart-updated', { detail: { count: cartCount(lines) } }));
}

export function cartCount(lines = readCart()): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

function sameLine(a: CartLine, b: { variantId: string; designId?: string; size?: string; storeSlug?: string }) {
  return (
    a.variantId === b.variantId &&
    (a.designId ?? '') === (b.designId ?? '') &&
    (a.size ?? '') === (b.size ?? '') &&
    (a.storeSlug ?? '') === (b.storeSlug ?? '')
  );
}

export function addToCart(
  variantId: string,
  quantity = 1,
  designId?: string,
  size?: string,
  extras?: Pick<CartLine, 'studioPrice' | 'printPositions' | 'positions' | 'storeSlug'>,
): CartLine[] {
  const lines = readCart();
  const existing = lines.find((l) => sameLine(l, { variantId, designId, size, storeSlug: extras?.storeSlug }));
  const cap = qtyCap({ studioPrice: extras?.studioPrice ?? existing?.studioPrice });
  if (existing) {
    existing.quantity = Math.min(cap, existing.quantity + quantity);
    if (extras?.studioPrice) existing.studioPrice = extras.studioPrice;
    if (extras?.printPositions) existing.printPositions = extras.printPositions;
    if (extras?.positions) existing.positions = extras.positions;
  } else {
    lines.push({
      variantId,
      quantity: Math.min(cap, quantity),
      designId,
      size,
      studioPrice: extras?.studioPrice,
      printPositions: extras?.printPositions,
      positions: extras?.positions,
      storeSlug: extras?.storeSlug,
    });
  }
  writeCart(lines);
  return lines;
}

export function setQuantity(
  variantId: string,
  quantity: number,
  designId?: string,
  size?: string,
  storeSlug?: string,
): CartLine[] {
  let lines = readCart();
  if (quantity <= 0) {
    lines = lines.filter((l) => !sameLine(l, { variantId, designId, size, storeSlug }));
  } else {
    const row = lines.find((l) => sameLine(l, { variantId, designId, size, storeSlug }));
    if (row) row.quantity = Math.min(qtyCap(row), quantity);
  }
  writeCart(lines);
  return lines;
}

export function clearCart(): void {
  writeCart([]);
}
