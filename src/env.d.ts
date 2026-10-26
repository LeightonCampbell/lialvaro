/// <reference types="astro/client" />

type D1Result<T = unknown> = {
  results: T[];
  success: boolean;
  meta?: unknown;
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = unknown>() => Promise<T | null>;
  run: <T = unknown>() => Promise<D1Result<T>>;
  all: <T = unknown>() => Promise<D1Result<T>>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

interface ImportMetaEnv {
  readonly STRIPE_SECRET_KEY?: string;
  readonly STRIPE_WEBHOOK_SECRET?: string;
  readonly RESEND_API_KEY?: string;
  readonly ORDER_NOTIFICATION_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
