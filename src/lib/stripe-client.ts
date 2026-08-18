import Stripe from "stripe";

export function getStripe(secretKey: string) {
	try {
		return new Stripe(secretKey, {
			httpClient: Stripe.createFetchHttpClient(),
		});
	} catch {
		return new Stripe(secretKey);
	}
}

export function webhookCryptoProvider() {
	return Stripe.createSubtleCryptoProvider();
}
