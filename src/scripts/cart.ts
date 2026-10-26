export type CartLine = { variantId: string; quantity: number };

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

export function addToCart(variantId: string, quantity = 1): CartLine[] {
  const lines = readCart();
  const existing = lines.find((l) => l.variantId === variantId);
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else lines.push({ variantId, quantity: Math.min(20, quantity) });
  writeCart(lines);
  return lines;
}

export function setQuantity(variantId: string, quantity: number): CartLine[] {
  let lines = readCart();
  if (quantity <= 0) lines = lines.filter((l) => l.variantId !== variantId);
  else {
    const row = lines.find((l) => l.variantId === variantId);
    if (row) row.quantity = Math.min(20, quantity);
  }
  writeCart(lines);
  return lines;
}

export function clearCart(): void {
  writeCart([]);
}
