export type ProviderRecipient = {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
};

export type ProviderOrderItemInput = {
  catalogVariantId: string | number;
  quantity: number;
  retailPrice?: string;
  name?: string;
  placements?: Array<{
    placement: string;
    technique?: string;
    layers: Array<{ type: string; url: string }>;
  }>;
};

export type ProviderShippingRate = {
  id: string;
  name: string;
  rateCents: number;
  currency: string;
};

export type ProviderOrder = {
  id: string | number;
  status: string;
  externalId?: string;
  raw?: unknown;
};

export type FulfillmentProvider = {
  name: string;
  listProducts: (opts?: { limit?: number; offset?: number }) => Promise<unknown>;
  getVariants: (catalogProductId: string | number) => Promise<unknown>;
  getShippingRates: (input: {
    recipient: ProviderRecipient;
    items: Array<{ catalogVariantId: string | number; quantity: number }>;
  }) => Promise<ProviderShippingRate[]>;
  createOrder: (input: {
    externalId: string;
    recipient: ProviderRecipient;
    items: ProviderOrderItemInput[];
  }) => Promise<ProviderOrder>;
  getOrderStatus: (providerOrderId: string | number) => Promise<ProviderOrder>;
  handleWebhook: (payload: unknown, headers: Headers) => Promise<{ ok: boolean; eventId?: string }>;
};
