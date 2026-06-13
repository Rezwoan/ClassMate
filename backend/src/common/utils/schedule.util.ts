/**
 * Date helpers for the weekly schedule. All "day" comparisons happen in a
 * uniform UTC-midnight space derived from calendar Y/M/D values, so a session's
 * weekday and a semester's bounds compare consistently regardless of timezone.
 */

const DAY_MS = 86_400_000;

export interface ZonedNow {
  /** UTC-midnight Date for the user's local calendar day. */
  utcMidnight: Date;
  /** 0 = Sunday … 6 = Saturday (local). */
  weekday: number;
  /** Minutes since local midnight (e.g. 13:30 → 810). */
  minutesOfDay: number;
}

/** Resolves the user's local "now" using their IANA timezone. */
export function getZonedNow(timezone: string, instant: Date = new Date()): ZonedNow {
  const tz = timezone || 'UTC';
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(instant).map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0; // some engines emit "24" for midnight
  const minute = Number(parts.minute);

  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  return {
    utcMidnight,
    weekday: utcMidnight.getUTCDay(),
    minutesOfDay: hour * 60 + minute,
  };
}

/** UTC-midnight of the calendar day a Date falls on (by its UTC parts). */
export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addDays(midnight: Date, days: number): Date {
  return new Date(midnight.getTime() + days * DAY_MS);
}

/** "YYYY-MM-DD" for a UTC-midnight date. */
export function formatYmd(midnight: Date): string {
  return midnight.toISOString().slice(0, 10);
}

/** "HH:mm" → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * The Nth occurrence (1-based) of `weekday` on `dayMidnight`, counting from the
 * semester start. Returns 0 if `dayMidnight` is before the first occurrence.
 */
export function occurrenceNumber(
  semesterStart: Date,
  dayMidnight: Date,
  weekday: number,
): number {
  const startWeekday = semesterStart.getUTCDay();
  const offset = (weekday - startWeekday + 7) % 7;
  const firstOccurrence = addDays(semesterStart, offset);
  if (dayMidnight < firstOccurrence) return 0;
  return Math.floor((dayMidnight.getTime() - firstOccurrence.getTime()) / (7 * DAY_MS)) + 1;
}
