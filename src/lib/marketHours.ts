/* US market hours helper. The TopBar's "MARKET OPEN" pill used to be
   a hardcoded JSX string regardless of clock or day — pulses red at
   2am Sunday promising a live exchange. This computes the real state.

   Hours used (NYSE regular session):
     Mon–Fri, 09:30 – 16:00 America/New_York
   Pre-market (04:00–09:30) and after-hours (16:00–20:00) are reported
   separately so the UI can show a yellow "PRE-MARKET" / "AFTER-HOURS"
   pill if it wants. Holidays are NOT honored — that needs a calendar
   feed and isn't in scope for the P0 fix. Worst case: a Memorial Day
   tradeable-looking pill appears when the market is actually closed;
   the user clicks through and sees no data move. */

export type MarketStatus = 'open' | 'pre-market' | 'after-hours' | 'closed';

/* Returns the current NYSE wall-clock as { day, hours, minutes }. Uses
   Intl.DateTimeFormat with the America/New_York tz so we don't have
   to do DST math by hand. */
function nyNow(now: Date = new Date()): { day: number; hours: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const wdLabel = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[wdLabel] ?? 1;
  const hours = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return { day, hours, minutes };
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const { day, hours, minutes } = nyNow(now);
  if (day === 0 || day === 6) return 'closed';     // weekend
  const minutesSinceMidnight = hours * 60 + minutes;
  const PRE_OPEN  = 4 * 60;          // 04:00 ET
  const REG_OPEN  = 9 * 60 + 30;     // 09:30 ET
  const REG_CLOSE = 16 * 60;         // 16:00 ET
  const AFTER_END = 20 * 60;         // 20:00 ET
  if (minutesSinceMidnight < PRE_OPEN)  return 'closed';
  if (minutesSinceMidnight < REG_OPEN)  return 'pre-market';
  if (minutesSinceMidnight < REG_CLOSE) return 'open';
  if (minutesSinceMidnight < AFTER_END) return 'after-hours';
  return 'closed';
}

/* Pretty label + colour role for the pill. Roles map to existing
   stadium tokens — ref-red for live, whistle (amber) for pre/after,
   text-mute for closed. */
export interface MarketPillSpec {
  label: string;
  role: 'live' | 'amber' | 'muted';
}

export function getMarketPillSpec(status: MarketStatus): MarketPillSpec {
  switch (status) {
    case 'open':         return { label: 'MARKET OPEN',  role: 'live' };
    case 'pre-market':   return { label: 'PRE-MARKET',   role: 'amber' };
    case 'after-hours':  return { label: 'AFTER-HOURS',  role: 'amber' };
    default:             return { label: 'MARKET CLOSED', role: 'muted' };
  }
}
