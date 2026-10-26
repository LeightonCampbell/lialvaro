/**
 * Analytics event scaffold (Stage 4).
 * Provider TBD: owner chooses GA4 or Plausible; Microsoft Clarity to be added.
 * Until configured, events log to console in development and no-op in production.
 */

export type AnalyticsEvent =
  | 'quote_started'
  | 'quote_step_N'
  | 'quote_submitted'
  | 'design_started'
  | 'view_item'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase';

declare global {
  interface Window {
    lialvaroAnalytics?: {
      track: (event: AnalyticsEvent | string, props?: Record<string, unknown>) => void;
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function track(event: AnalyticsEvent | string, props: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;

  window.lialvaroAnalytics?.track(event, props);

  // GA4 (when configured)
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, props);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...props });
  }

  // Plausible (when configured)
  if (typeof window.plausible === 'function') {
    window.plausible(event, { props });
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event, props);
  }
}

export function initAnalyticsScaffold(): void {
  if (typeof window === 'undefined') return;
  window.lialvaroAnalytics = { track };
}
