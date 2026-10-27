export type AppEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  ORDER_NOTIFICATION_EMAIL?: string;
  DB?: D1Database;
};

type EnvBag = Record<string, unknown> | undefined | null;

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

let cloudflareEnvPromise: Promise<EnvBag> | undefined;

async function cloudflareEnv(): Promise<EnvBag> {
  if (!cloudflareEnvPromise) {
    cloudflareEnvPromise = (async () => {
      try {
        const specifier = 'cloudflare:workers';
        const mod = (await import(/* @vite-ignore */ specifier)) as {
          env?: Record<string, unknown>;
        };
        return mod.env;
      } catch {
        // Allow a later request to retry if the module wasn't ready yet.
        cloudflareEnvPromise = undefined;
        return undefined;
      }
    })();
  }
  return cloudflareEnvPromise;
}

function fromBag(bag: EnvBag, name: string): string | undefined {
  return asNonEmptyString(bag?.[name]);
}

export async function readSecret(name: string, runtimeEnv?: EnvBag): Promise<string | undefined> {
  const fromCf = (await cloudflareEnv())?.[name];
  const cloudflareValue = asNonEmptyString(fromCf);
  return (
    fromBag(runtimeEnv, name) ?? fromProcess(name) ?? fromVite(name) ?? cloudflareValue
  );
}

export async function getAppEnv(runtimeEnv?: EnvBag): Promise<AppEnv> {
  const cf = (runtimeEnv ?? (await cloudflareEnv())) as EnvBag;
  return {
    STRIPE_SECRET_KEY: await readSecret('STRIPE_SECRET_KEY', runtimeEnv),
    STRIPE_WEBHOOK_SECRET: await readSecret('STRIPE_WEBHOOK_SECRET', runtimeEnv),
    RESEND_API_KEY: await readSecret('RESEND_API_KEY', runtimeEnv),
    ORDER_NOTIFICATION_EMAIL: await readSecret('ORDER_NOTIFICATION_EMAIL', runtimeEnv),
    DB: cf?.DB as D1Database | undefined,
  };
}

/** Astro Cloudflare puts Worker bindings on `locals.runtime.env`. */
export function runtimeEnvFromLocals(locals: unknown): EnvBag {
  if (!locals || typeof locals !== 'object') return undefined;
  const runtime = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime;
  return runtime?.env;
}
