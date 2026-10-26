export type AppEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  ORDER_NOTIFICATION_EMAIL?: string;
  DB?: D1Database;
};

function fromProcess(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function fromVite(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

let cloudflareEnvPromise: Promise<Record<string, unknown> | undefined> | undefined;

async function cloudflareEnv(): Promise<Record<string, unknown> | undefined> {
  if (!cloudflareEnvPromise) {
    cloudflareEnvPromise = (async () => {
      try {
        const specifier = 'cloudflare:workers';
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

export async function readSecret(name: string): Promise<string | undefined> {
  const fromCf = (await cloudflareEnv())?.[name];
  const cloudflareValue = typeof fromCf === 'string' && fromCf.length > 0 ? fromCf : undefined;
  return fromProcess(name) ?? fromVite(name) ?? cloudflareValue;
}

export async function getAppEnv(): Promise<AppEnv> {
  const cf = await cloudflareEnv();
  return {
    STRIPE_SECRET_KEY: await readSecret('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: await readSecret('STRIPE_WEBHOOK_SECRET'),
    RESEND_API_KEY: await readSecret('RESEND_API_KEY'),
    ORDER_NOTIFICATION_EMAIL: await readSecret('ORDER_NOTIFICATION_EMAIL'),
    DB: cf?.DB as D1Database | undefined,
  };
}
