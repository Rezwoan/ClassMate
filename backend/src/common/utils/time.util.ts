const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses durations like "15m", "7d", "12h", "30s" into milliseconds. */
export function parseDurationMs(input: string, fallbackMs = 7 * 86_400_000): number {
  const match = /^(\d+)\s*([smhd])$/.exec(input.trim());
  if (!match) return fallbackMs;
  return Number(match[1]) * UNIT_MS[match[2]];
}
