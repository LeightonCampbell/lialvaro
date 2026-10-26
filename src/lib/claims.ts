import claimsData from '../data/claims.json';

export type Claim = {
  id: string;
  text: string;
  confirmed: boolean;
  notes?: string;
  surfaces?: string[];
};

const claims = claimsData.claims as Claim[];

export const brand = claimsData.brand as string;

export function getClaim(id: string): Claim | undefined {
  return claims.find((c) => c.id === id);
}

/** Returns claim text only when confirmed; otherwise undefined. */
export function claimText(id: string): string | undefined {
  const claim = getClaim(id);
  if (!claim?.confirmed) return undefined;
  return claim.text;
}

export function requireClaim(id: string): string {
  const text = claimText(id);
  if (!text) {
    throw new Error(`Claim "${id}" is missing or not confirmed`);
  }
  return text;
}

export function confirmedClaims(): Claim[] {
  return claims.filter((c) => c.confirmed);
}
