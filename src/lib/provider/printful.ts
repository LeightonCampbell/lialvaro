/**
 * Printful API v2 client (Open Beta).
 * Docs: https://developers.printful.com/docs/v2-beta/
 * Catalog: GET /v2/catalog-products, variants, prices
 * Orders: POST /v2/orders (draft), POST /v2/orders/{id}/order-items, POST /v2/orders/{id}/confirmation
 */
import type {
  FulfillmentProvider,
  ProviderOrder,
  ProviderOrderItemInput,
  ProviderRecipient,
  ProviderShippingRate,
} from './types';

const BASE = 'https://api.printful.com';

type PrintfulConfig = {
  token: string;
  storeId?: string;
};

async function pfFetch(config: PrintfulConfig, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${config.token}`);
  headers.set('Content-Type', 'application/json');
  if (config.storeId) headers.set('X-PF-Store-Id', config.storeId);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`Printful ${init.method ?? 'GET'} ${path} failed (${res.status}): ${text.slice(0, 400)}`);
  }
  return body as Record<string, unknown>;
}

export function createPrintfulProvider(config: PrintfulConfig): FulfillmentProvider {
  return {
    name: 'printful',

    async listProducts(opts = {}) {
      const limit = opts.limit ?? 20;
      const offset = opts.offset ?? 0;
      return pfFetch(config, `/v2/catalog-products?limit=${limit}&offset=${offset}`);
    },

    async getVariants(catalogProductId) {
      return pfFetch(config, `/v2/catalog-products/${catalogProductId}/catalog-variants`);
    },

    async getShippingRates() {
      // v2 shipping estimate endpoints vary by region; Stage 5 uses Stripe shipping
      // collection + pricing.json fallback until rates API is owner-confirmed.
      const fallback: ProviderShippingRate[] = [
        { id: 'STANDARD', name: 'Standard', rateCents: 599, currency: 'usd' },
      ];
      return fallback;
    },

    async createOrder(input) {
      const orderBody = {
        external_id: input.externalId,
        recipient: input.recipient,
      };
      const created = await pfFetch(config, '/v2/orders', {
        method: 'POST',
        body: JSON.stringify(orderBody),
      });
      const data = (created.data ?? created) as { id?: string | number };
      const orderId = data.id;
      if (orderId == null) throw new Error('Printful createOrder: missing order id');

      if (input.items.length) {
        await pfFetch(config, `/v2/orders/${orderId}/order-items`, {
          method: 'POST',
          body: JSON.stringify(
            input.items.map((item: ProviderOrderItemInput) => ({
              source: 'catalog',
              catalog_variant_id: Number(item.catalogVariantId),
              quantity: item.quantity,
              retail_price: item.retailPrice,
              name: item.name,
              placements: item.placements,
            })),
          ),
        });
      }

      return { id: orderId, status: 'draft', externalId: input.externalId, raw: created };
    },

    async getOrderStatus(providerOrderId) {
      const res = await pfFetch(config, `/v2/orders/${providerOrderId}`);
      const data = (res.data ?? res) as { id?: string | number; status?: string; external_id?: string };
      return {
        id: data.id ?? providerOrderId,
        status: data.status ?? 'unknown',
        externalId: data.external_id,
        raw: res,
      } satisfies ProviderOrder;
    },

    async handleWebhook(payload) {
      const event = payload as { id?: string; type?: string };
      return { ok: true, eventId: event.id ?? event.type };
    },
  };
}

export type { ProviderRecipient };
