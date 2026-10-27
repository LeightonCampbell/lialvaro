export type AppEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  ORDER_NOTIFICATION_EMAIL?: string;
  DB?: D1Database;
};

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function fromProcess(name: string): string | undefined {
  return asNonEmptyString(process.env[name]);
}

function fromVite(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return asNonEmptyString(value);
}

async function cloudflareWorkersEnv(): Promise<Record<string, unknown> | undefined> {
  try {
    // Astro 6 + Cloudflare: secrets/bindings come from here (not locals.runtime.env).
    const mod = (await import('cloudflare:workers')) as {
      env?: Record<string, unknown>;
    };
    return mod.env;
  } catch {
    return undefined;
  }
}

export async function readSecret(name: string): Promise<string | undefined> {
  const cf = await cloudflareWorkersEnv();
  return fromProcess(name) ?? fromVite(name) ?? asNonEmptyString(cf?.[name]);
}

export async function getAppEnv(): Promise<AppEnv> {
  const cf = await cloudflareWorkersEnv();
  return {
    STRIPE_SECRET_KEY: await readSecret('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: await readSecret('STRIPE_WEBHOOK_SECRET'),
    RESEND_API_KEY: await readSecret('RESEND_API_KEY'),
    ORDER_NOTIFICATION_EMAIL: await readSecret('ORDER_NOTIFICATION_EMAIL'),
    DB: cf?.DB as D1Database | undefined,
  };
}
