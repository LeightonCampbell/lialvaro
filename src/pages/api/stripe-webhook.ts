import type { APIRoute } from "astro";
import type Stripe from "stripe";
import { getCheckoutEnv } from "../../lib/checkout-env";
import { getStripe, webhookCryptoProvider } from "../../lib/stripe-client";

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function shippingFrom(session: Stripe.Checkout.Session) {
	return (
		session.collected_information?.shipping_details ??
		session.customer_details?.address ??
		null
	);
}

export const POST: APIRoute = async ({ request }) => {
	const env = await getCheckoutEnv();
	if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
		return json({ error: "Stripe webhook is not configured." }, 500);
	}

	const stripe = getStripe(env.stripeSecretKey);
	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return json({ error: "Missing Stripe signature." }, 400);
	}

	const body = await request.text();

	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(
			body,
			signature,
			env.stripeWebhookSecret,
			undefined,
			webhookCryptoProvider(),
		);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Invalid signature.";
		return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
		const orderSummary = lineItems.data
			.map((li) => `${li.quantity}x ${li.description} — $${((li.amount_total ?? 0) / 100).toFixed(2)}`)
			.join("\n");
		const customerEmail = session.customer_details?.email ?? "unknown";

		if (env.resendApiKey && env.orderNotificationEmail) {
			await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.resendApiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from: "orders@lialvaro.com",
					to: env.orderNotificationEmail,
					subject: `New order — ${session.id}`,
					text: `New paid order.\n\nCustomer: ${customerEmail}\nShipping: ${JSON.stringify(shippingFrom(session), null, 2)}\n\nItems:\n${orderSummary}\n\nTotal: $${((session.amount_total ?? 0) / 100).toFixed(2)}`,
				}),
			});
		}
	}

	return json({ received: true });
};
