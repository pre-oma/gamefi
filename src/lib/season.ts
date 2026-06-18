/* Season clock helpers — shared between client and server so the
   gameweek/quarter/window calculations stay consistent everywhere.
   The season row in Supabase is canonical for start_date and
   season_number; pure math (gameweek, quarter, window-open) is
   computed from that anchor. */

import {
  SEASON_TOTAL_WEEKS,
  WEEKS_PER_QUARTER,
  QUARTER_OPEN_GAMEWEEKS,
  QUARTER_WINDOW_LENGTH_WEEKS,
  WEEKEND_OPEN_DAY_UTC,
  WEEKEND_OPEN_HOUR_UTC,
  WEEKEND_CLOSE_DAY_UTC,
  WEEKEND_CLOSE_HOUR_UTC,
} from '@/types';

export interface SeasonRow {
  seasonNumber: number;
  startDate: string;   // YYYY-MM-DD (Monday)
  totalWeeks: number;
}

/* Compute current gameweek (1..totalWeeks). Returns 1 before the
   season starts and totalWeeks after it ends — callers can detect
   end-of-season by comparing now vs (startDate + totalWeeks*7). */
export function computeGameweek(startDateIso: string, totalWeeks: number, now: Date = new Date()): number {
  const start = new Date(startDateIso + 'T00:00:00Z').getTime();
  const diffMs = now.getTime() - start;
  if (diffMs < 0) return 1;
  const weeksElapsed = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.min(totalWeeks, weeksElapsed + 1);
}

export function computeQuarter(gameweek: number): number {
  return Math.min(4, Math.floor((gameweek - 1) / WEEKS_PER_QUARTER) + 1);
}

/* True if `gameweek` falls inside any of the four quarterly windows.
   Windows are [openWeek, openWeek + length - 1] inclusive. */
export function isTransferWindowOpen(gameweek: number): boolean {
  return QUARTER_OPEN_GAMEWEEKS.some(
    (open) => gameweek >= open && gameweek < open + QUARTER_WINDOW_LENGTH_WEEKS,
  );
}

/* True if `now` falls inside the weekend window. Window is
   Fri 21:00 UTC → Mon 05:00 UTC. Day-of-week uses UTC to stay
   timezone-independent. */
export function isWeekendWindowOpen(now: Date = new Date()): boolean {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === WEEKEND_OPEN_DAY_UTC) return hour >= WEEKEND_OPEN_HOUR_UTC; // Fri 21:00+
  if (day === 6) return true;                                              // all Saturday
  if (day === 0) return true;                                              // all Sunday
  if (day === WEEKEND_CLOSE_DAY_UTC) return hour < WEEKEND_CLOSE_HOUR_UTC; // Mon until 05:00
  return false;
}

/* Returns the start (Friday 21:00 UTC) of the current/most recent
   weekend window — useful for snapshot scheduling and "weekend
   counter" keys when enforcing the per-weekend swap cap. */
export function currentWeekendKey(now: Date = new Date()): string {
  const d = new Date(now);
  // Roll back to last Friday 21:00 UTC
  while (d.getUTCDay() !== WEEKEND_OPEN_DAY_UTC || d.getUTCHours() < WEEKEND_OPEN_HOUR_UTC) {
    d.setUTCHours(d.getUTCHours() - 1);
  }
  // Truncate to the hour
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

export function getSeasonState(row: SeasonRow, now: Date = new Date()) {
  const currentGameweek = computeGameweek(row.startDate, row.totalWeeks, now);
  const currentQuarter = computeQuarter(currentGameweek);
  return {
    seasonNumber: row.seasonNumber,
    startDate: row.startDate,
    totalWeeks: row.totalWeeks,
    currentGameweek,
    currentQuarter,
    isTransferWindowOpen: isTransferWindowOpen(currentGameweek),
    isWeekendWindowOpen: isWeekendWindowOpen(now),
  };
}

/* All gameweeks that fall inside the given quarter — handy for
   UI like "Q2 window: GW14, GW15". */
export function gameweeksInQuarter(quarter: number): number[] {
  const openWeek = QUARTER_OPEN_GAMEWEEKS[quarter - 1];
  if (openWeek === undefined) return [];
  return Array.from({ length: QUARTER_WINDOW_LENGTH_WEEKS }, (_, i) => openWeek + i);
}

/* All gameweeks 1..N */
export function allGameweeks(): number[] {
  return Array.from({ length: SEASON_TOTAL_WEEKS }, (_, i) => i + 1);
}
