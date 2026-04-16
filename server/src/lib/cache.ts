import { CACHE_TTL_MS } from "../config/constants";

/**
 * Represents a single entry in the cache with expiration metadata.
 *
 * @template T - The type of data stored in this cache entry
 */
interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** Unix timestamp (in milliseconds) when this entry expires */
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL (time-to-live) support.
 *
 * Automatically removes expired entries when accessed. Useful for caching
 * expensive computations or API responses.
 */
class Cache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieves a value from the cache.
   *
   * Automatically removes and returns null if the entry has expired.
   *
   * @template T - The expected type of the cached value
   * @param key - The cache key to look up
   * @returns The cached value if found and not expired, otherwise null
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Stores a value in the cache with an optional TTL.
   *
   * @template T - The type of the value to cache
   * @param key - The cache key
   * @param data - The data to cache
   * @param ttlMs - Time-to-live in milliseconds (defaults to CACHE_TTL_MS)
   */
  set<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Removes a single entry from the cache.
   *
   * @param key - The cache key to remove
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Removes all cache entries whose keys start with the given prefix.
   *
   * Useful for invalidating related entries (e.g., all entries for a user).
   *
   * @param prefix - The key prefix to match
   *
   * @example
   * ```typescript
   * cache.invalidatePrefix("user:123:"); // Removes all user 123 entries
   * ```
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

/**
 * Singleton cache instance for application-wide use.
 *
 * @example
 * ```typescript
 * import { cache } from "./lib/cache";
 *
 * // Store a value
 * cache.set("expensive-result", data);
 *
 * // Retrieve a value
 * const result = cache.get<MyType>("expensive-result");
 * ```
 */
export const cache = new Cache();
