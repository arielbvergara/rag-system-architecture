/**
 * Returns the Error message if err is an Error instance,
 * otherwise returns the provided fallback string.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
