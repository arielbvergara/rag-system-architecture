/**
 * Combines multiple class names into a single string, filtering out falsy values.
 * Useful for conditionally applying classes and combining with optional className props.
 *
 * @example
 * cn("base-class", condition && "conditional-class", className)
 * cn("text-lg", "font-bold", undefined, "text-primary") // "text-lg font-bold text-primary"
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ").trim();
}

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
