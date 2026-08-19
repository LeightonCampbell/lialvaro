import type { APIRoute } from "astro";
import { CATALOG, isProductId } from "../../lib/catalog";
import { getCheckoutEnv } from "../../lib/checkout-env";
import { getStripe } from "../../lib/stripe-client";

export const prerender = false;

type CartItem = {
	id?: unknown;
	qty?: unknown;
	quantity?: unknown;
};

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const POST: APIRoute = async ({ request, url }) => {
	try {
		let payload: { items?: CartItem[] };
		try {
			payload = await request.json();
		} catch {
			return json({ error: "Invalid JSON body." }, 400);
		}

		const items = Array.isArray(payload.items) ? payload.items : [];
		if (!items.length) {
			return json({ error: "Cart is empty" }, 400);
		}

		const lineItems = items.map((item) => {
			if (typeof item.id !== "string" || !isProductId(item.id)) {
				throw new Error(`Unknown product: ${String(item.id)}`);
			}
			const qty = Number(item.qty ?? item.quantity);
			if (!Number.isFinite(qty)) {
				throw new Error("Invalid quantity.");
			}
			const product = CATALOG[item.id];
			return {
				price_data: {
					currency: "usd" as const,
					product_data: { name: product.name },
					unit_amount: product.amount,
				},
				quantity: Math.max(1, Math.min(qty, 20)),
			};
		});

		const { stripeSecretKey } = await getCheckoutEnv();
		if (!stripeSecretKey) {
			return json({ error: "Stripe is not configured." }, 500);
		}

		const stripe = getStripe(stripeSecretKey);
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: lineItems,
			success_url: `${url.origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/shop`,
			shipping_address_collection: { allowed_countries: ["US"] },
		});

		return json({ url: session.url });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Could not start checkout.";
		return json({ error: message }, 500);
	}
};
