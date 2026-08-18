import type { APIRoute } from "astro";
import Stripe from "stripe";
import { getCheckoutEnv, type CheckoutEnv } from "../../lib/checkout-env";

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function lineSummary(session: Stripe.Checkout.Session) {
	const items = session.line_items?.data ?? [];
	if (items.length === 0) return "See Stripe Dashboard for line items.";
	return items
		.map((item) => {
			const name = item.description || item.price?.product || "Item";
			const qty = item.quantity ?? 1;
			const amount = ((item.amount_total ?? 0) / 100).toFixed(2);
			return `${qty}× ${name} — $${amount}`;
		})
		.join("<br>");
}

async function notifyOrder(env: CheckoutEnv, session: Stripe.Checkout.Session) {
	if (!env.resendApiKey || !env.orderNotificationEmail) return;

	const total = ((session.amount_total ?? 0) / 100).toFixed(2);
	const email = session.customer_details?.email || "not provided";
	const name = session.customer_details?.name || "not provided";
	const address = session.customer_details?.address;
	const addressLine = address
		? [address.line1, address.line2, address.city, address.state, address.postal_code]
				.filter(Boolean)
				.join(", ")
		: "not provided";

	await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.resendApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: "LiAlvaro Orders <beth.t@example.com>",
			to: [env.orderNotificationEmail],
			subject: `New store order ${session.id}`,
			html: `
				<p>A store checkout just completed.</p>
				<p><strong>Session:</strong> ${session.id}</p>
				<p><strong>Customer:</strong> ${name} (${email})</p>
				<p><strong>Ship to:</strong> ${addressLine}</p>
				<p><strong>Total:</strong> $${total} ${session.currency?.toUpperCase() || "USD"}</p>
				<p><strong>Items:</strong><br>${lineSummary(session)}</p>
			`,
		}),
	});
}

export const POST: APIRoute = async ({ request }) => {
	const env = await getCheckoutEnv();
	if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
		return json({ error: "Stripe webhook is not configured." }, 500);
	}

	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return json({ error: "Missing Stripe signature." }, 400);
	}

	const rawBody = await request.text();
	const stripe = new Stripe(env.stripeSecretKey);

	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.stripeWebhookSecret);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Invalid signature.";
		return json({ error: message }, 400);
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const full = await stripe.checkout.sessions.retrieve(session.id, {
			expand: ["line_items"],
		});
		await notifyOrder(env, full);
	}

	return json({ received: true });
};
