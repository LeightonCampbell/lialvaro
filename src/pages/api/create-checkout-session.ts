import type { APIRoute } from "astro";
import Stripe from "stripe";
import { CATALOG, isProductId } from "../../lib/catalog";
import { getCheckoutEnv } from "../../lib/checkout-env";

export const prerender = false;

type CartItem = {
	id?: unknown;
	quantity?: unknown;
};

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const POST: APIRoute = async ({ request, url }) => {
	let payload: { items?: CartItem[] };
	try {
		payload = await request.json();
	} catch {
		return json({ error: "Invalid JSON body." }, 400);
	}

	const items = Array.isArray(payload.items) ? payload.items : [];
	if (items.length === 0) {
		return json({ error: "Your cart is empty." }, 400);
	}

	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
	for (const item of items) {
		if (typeof item.id !== "string" || !isProductId(item.id)) {
			return json({ error: "Unknown product in cart." }, 400);
		}
		const quantity = Number(item.quantity);
		if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
			return json({ error: "Invalid quantity." }, 400);
		}
		const product = CATALOG[item.id];
		lineItems.push({
			quantity,
			price_data: {
				currency: "usd",
				unit_amount: product.amount,
				product_data: {
					name: product.name,
					description: product.meta,
				},
			},
		});
	}

	const { stripeSecretKey } = await getCheckoutEnv();
	if (!stripeSecretKey) {
		return json({ error: "Stripe is not configured." }, 500);
	}

	try {
		const stripe = new Stripe(stripeSecretKey);
		const origin = url.origin;
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: lineItems,
			success_url: `${origin}/order-confirmed/?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/#store`,
			shipping_address_collection: {
				allowed_countries: ["US"],
			},
			metadata: {
				source: "lialvaro-store",
			},
		});

		if (!session.url) {
			return json({ error: "Could not start checkout." }, 500);
		}

		return json({ url: session.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Could not start checkout.";
		return json({ error: message }, 500);
	}
};
