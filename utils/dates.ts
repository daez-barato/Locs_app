const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Short "time left" label for an event's expiry, as shown on cards.
 *
 * Whole units are floored, so 30 hours reads "1 day left" rather than
 * overstating it, and the last day counts down in hours and minutes — events
 * can be as short as a few minutes.
 */
export function formatTimeLeft(expireDate: string | Date, now: Date = new Date()): string {
  const expires = new Date(expireDate).getTime();
  if (Number.isNaN(expires)) return "—";

  const left = expires - now.getTime();
  if (left <= 0) return "Expired";
  if (left < HOUR) return `${Math.max(1, Math.floor(left / MINUTE))}m left`;
  if (left < DAY) return `${Math.floor(left / HOUR)}h left`;

  const days = Math.floor(left / DAY);
  return `${days} ${days === 1 ? "day" : "days"} left`;
}
