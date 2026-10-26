import sameDay from '../data/same-day.json';

export type SameDayConfig = typeof sameDay;

export function getSameDayConfig(): SameDayConfig {
  return sameDay;
}

export function isZipEligible(zip: string, config: SameDayConfig = sameDay): boolean {
  const normalized = zip.trim().slice(0, 5);
  return config.eligible_zips.includes(normalized);
}

/** Returns whether same-day request UI may be offered (local lane + ZIP + before cutoff). */
export function canRequestSameDay(opts: {
  lane: string;
  zip?: string;
  now?: Date;
  config?: SameDayConfig;
}): boolean {
  const config = opts.config ?? sameDay;
  if (!config.enabled) return false;
  if (!config.eligible_lanes.includes(opts.lane)) return false;
  if (!opts.zip || !isZipEligible(opts.zip, config)) return false;

  const now = opts.now ?? new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '99');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '99');
  const [cutH, cutM] = config.cutoff_local.split(':').map(Number);
  const nowMinutes = hour * 60 + minute;
  const cutMinutes = cutH * 60 + cutM;
  return nowMinutes < cutMinutes;
}
