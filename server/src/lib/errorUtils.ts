/**
 * Safely extracts an error message from an unknown error value.
 *
 * @param err - The error value to extract a message from (can be any type)
 * @param fallback - The fallback message to return if err is not an Error instance
 * @returns The error message if err is an Error, otherwise the fallback string
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   const message = getErrorMessage(err, "Operation failed");
 *   console.error(message);
 * }
 * ```
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
