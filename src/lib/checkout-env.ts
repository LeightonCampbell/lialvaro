export type CheckoutEnv = {
	stripeSecretKey?: string;
	stripeWebhookSecret?: string;
	resendApiKey?: string;
	orderNotificationEmail?: string;
};

function fromProcess(name: string): string | undefined {
	const value = process.env[name];
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function fromVite(name: string): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>)[name];
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

let cloudflareEnvPromise: Promise<Record<string, unknown> | undefined> | undefined;

async function cloudflareEnv(): Promise<Record<string, unknown> | undefined> {
	if (!cloudflareEnvPromise) {
		cloudflareEnvPromise = (async () => {
			try {
				const specifier = "cloudflare:workers";
				const mod = (await import(/* @vite-ignore */ specifier)) as {
					env?: Record<string, unknown>;
				};
				return mod.env;
			} catch {
				return undefined;
			}
		})();
	}

	return cloudflareEnvPromise;
}

async function readSecret(name: string): Promise<string | undefined> {
	const fromCf = (await cloudflareEnv())?.[name];
	const cloudflareValue = typeof fromCf === "string" && fromCf.length > 0 ? fromCf : undefined;
	return fromProcess(name) ?? fromVite(name) ?? cloudflareValue;
}

export async function getCheckoutEnv(): Promise<CheckoutEnv> {
	return {
		stripeSecretKey: await readSecret("STRIPE_SECRET_KEY"),
		stripeWebhookSecret: await readSecret("STRIPE_WEBHOOK_SECRET"),
		resendApiKey: await readSecret("RESEND_API_KEY"),
		orderNotificationEmail: await readSecret("ORDER_NOTIFICATION_EMAIL"),
	};
}
