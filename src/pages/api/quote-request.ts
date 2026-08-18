import type { APIRoute } from "astro";
import { getCheckoutEnv } from "../../lib/checkout-env";

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function asText(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

export const POST: APIRoute = async ({ request }) => {
	try {
		let data: Record<string, unknown>;
		try {
			data = await request.json();
		} catch {
			return json({ error: "Invalid JSON body." }, 400);
		}

		const name = asText(data.name);
		const email = asText(data.email);
		const phone = asText(data.phone);
		const quantity = asText(data.quantity);
		const garment = asText(data.garment);
		const method = asText(data.method);
		const notes = asText(data.notes);

		if (!name || !email || !quantity) {
			return json({ error: "Missing required fields" }, 400);
		}

		const { resendApiKey, orderNotificationEmail } = await getCheckoutEnv();
		if (!resendApiKey || !orderNotificationEmail) {
			return json({ error: "Quote email is not configured." }, 500);
		}

		// File uploads are not attached here — JSON cannot carry the design file.
		// Multipart + storage (e.g. Cloudflare R2) would be needed for that.
		const resendRes = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${resendApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "quotes@lialvaro.com",
				to: orderNotificationEmail,
				reply_to: email,
				subject: `New quote request — ${name}`,
				text: `New custom printing quote request.
Name: ${name}
Email: ${email}
Phone: ${phone || "not provided"}
Garment: ${garment || "not specified"}
Quantity: ${quantity}
Print method: ${method || "not specified"}
Notes:
${notes || "(none)"}`,
			}),
		});

		if (!resendRes.ok) {
			const detail = await resendRes.text();
			return json({ error: "Failed to send quote email", detail }, 502);
		}

		return json({ received: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Quote request failed";
		return json({ error: message }, 500);
	}
};
