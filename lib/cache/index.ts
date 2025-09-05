/**
 * Cache utilities for Next.js application
 * Provides revalidation tags and cache control helpers
 */

import { revalidateTag as nextRevalidateTag, unstable_cache } from 'next/cache';

/**
 * Cache tags for different data types
 */
export const CACHE_TAGS = {
  // User related
  USERS: 'users',
  USER: (id: string) => `user:${id}`,
  ROLES: 'roles',
  ROLE: (id: string) => `role:${id}`,
  USER_ROLES: 'user-roles',
  
  // Module specific
  PROFILES: 'profiles',
  PROFILE: (id: string) => `profile:${id}`,
  
  // Global
  ALL: 'all',
} as const;

/**
 * Cache durations in seconds
 */
export const CACHE_DURATIONS = {
  // Static data
  YEAR: 60 * 60 * 24 * 365,
  MONTH: 60 * 60 * 24 * 30,
  WEEK: 60 * 60 * 24 * 7,
  DAY: 60 * 60 * 24,
  
  // Dynamic data
  HOUR: 60 * 60,
  HALF_HOUR: 60 * 30,
  QUARTER_HOUR: 60 * 15,
  FIVE_MINUTES: 60 * 5,
  MINUTE: 60,
  
  // Real-time
  NONE: 0,
} as const;

/**
 * Revalidate specific cache tags
 */
export async function revalidateCache(tags: string | string[]): Promise<void> {
  const tagsArray = Array.isArray(tags) ? tags : [tags];
  
  for (const tag of tagsArray) {
    try {
      await nextRevalidateTag(tag);
    } catch (error) {
      console.error(`Failed to revalidate cache tag: ${tag}`, error);
    }
  }
}

/**
 * Revalidate all caches
 */
export async function revalidateAllCaches(): Promise<void> {
  await revalidateCache(CACHE_TAGS.ALL);
}

/**
 * Create a cached function with specific options
 * 
 * @example
 * const getCachedUsers = createCachedFunction(
 *   getUsersFromDB,
 *   ['users'],
 *   { revalidate: 60 }
 * );
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  tags: string[],
  options: {
    revalidate?: number;
  } = {}
): T {
  return unstable_cache(
    fn,
    undefined,
    {
      tags,
      revalidate: options.revalidate ?? CACHE_DURATIONS.FIVE_MINUTES,
    }
  ) as T;
}

/**
 * Generate cache headers for API responses
 */
export function generateCacheHeaders(options: {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  noCache?: boolean;
  private?: boolean;
  immutable?: boolean;
}): HeadersInit {
  const {
    maxAge,
    sMaxAge,
    staleWhileRevalidate,
    noCache = false,
    private: isPrivate = false,
    immutable = false,
  } = options;
  
  if (noCache) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }
  
  const directives: string[] = [];
  
  if (isPrivate) {
    directives.push('private');
  } else {
    directives.push('public');
  }
  
  if (maxAge !== undefined) {
    directives.push(`max-age=${maxAge}`);
  }
  
  if (sMaxAge !== undefined) {
    directives.push(`s-maxage=${sMaxAge}`);
  }
  
  if (staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  
  if (immutable) {
    directives.push('immutable');
  }
  
  return {
    'Cache-Control': directives.join(', '),
  };
}

/**
 * Cache key generator for complex queries
 */
export function generateCacheKey(base: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return base;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('-');
  
  return `${base}:${sortedParams}`;
}

/**
 * Wrapper for fetch with automatic caching
 */
export async function cachedFetch(
  url: string,
  options: RequestInit & {
    tags?: string[];
    revalidate?: number;
  } = {}
): Promise<Response> {
  const { tags = [], revalidate = CACHE_DURATIONS.FIVE_MINUTES, ...fetchOptions } = options;
  
  return fetch(url, {
    ...fetchOptions,
    next: {
      revalidate,
      tags,
    },
  });
}

/**
 * Helper to determine if data is stale
 */
export function isDataStale(
  lastUpdated: Date | string,
  maxAge: number = CACHE_DURATIONS.FIVE_MINUTES
): boolean {
  const lastUpdatedTime = typeof lastUpdated === 'string' 
    ? new Date(lastUpdated).getTime()
    : lastUpdated.getTime();
  
  const now = Date.now();
  const ageInSeconds = (now - lastUpdatedTime) / 1000;
  
  return ageInSeconds > maxAge;
}

/**
 * Cache headers for different content types
 */
export const CACHE_HEADERS = {
  // Static assets - 1 year
  STATIC: generateCacheHeaders({
    maxAge: CACHE_DURATIONS.YEAR,
    immutable: true,
  }),
  
  // Images - 1 month
  IMAGES: generateCacheHeaders({
    maxAge: CACHE_DURATIONS.MONTH,
    sMaxAge: CACHE_DURATIONS.MONTH,
  }),
  
  // API responses - stale while revalidate
  API: generateCacheHeaders({
    sMaxAge: 10,
    staleWhileRevalidate: 59,
  }),
  
  // User data - shorter cache
  USER_DATA: generateCacheHeaders({
    sMaxAge: 5,
    staleWhileRevalidate: 10,
  }),
  
  // No cache
  NO_CACHE: generateCacheHeaders({
    noCache: true,
  }),
  
  // Private user data
  PRIVATE: generateCacheHeaders({
    private: true,
    maxAge: 0,
  }),
} as const;

export default {
  CACHE_TAGS,
  CACHE_DURATIONS,
  CACHE_HEADERS,
  revalidateCache,
  revalidateAllCaches,
  createCachedFunction,
  generateCacheHeaders,
  generateCacheKey,
  cachedFetch,
  isDataStale,
};