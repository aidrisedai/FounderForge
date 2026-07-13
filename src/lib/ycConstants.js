// Shared YC-sprint constants, safe to import from both client components and
// server code (no prisma / SDK imports here).

export const MIN_DURATION = 14;
export const MAX_DURATION = 180;
export const DETAIL_WINDOW = 7;

export function clampDuration(n) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return 90;
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, v));
}

// Token budget for calls that emit the full day-by-day plan as JSON.
export function planMaxTokens(durationDays) {
  return durationDays > 100 ? 20000 : 8192;
}
