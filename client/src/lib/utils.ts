/**
 * Formats an ISO date string to a human-readable short date.
 * e.g. "2026-01-15T10:00:00Z" → "Jan 15, 2026"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
