import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/helpers';
import { headers } from 'next/headers';
import { createApiLogger } from '@/lib/logging';

/**
 * Cache statistics endpoint for monitoring cache performance
 * Only accessible to super admins in non-production environments
 */
export async function GET(request: Request) {
  const logger = createApiLogger(request, { module: 'api', action: 'cache-stats' });
  // Add production check FIRST
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  // Then check super_admin for non-production
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const headersList = await headers();
    
    // Get cache-related headers from the request
    const cacheControl = headersList.get('cache-control');
    const xCache = headersList.get('x-cache');
    const xCacheHit = headersList.get('x-cache-hit');
    const age = headersList.get('age');
    const xVercelCache = headersList.get('x-vercel-cache');
    const xVercelId = headersList.get('x-vercel-id');
    
    // Cache performance metrics
    const cacheStats = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      deployment: process.env.VERCEL_ENV || 'local',
      
      // Request cache info
      request: {
        cacheControl: cacheControl || 'not-set',
        xCache: xCache || 'not-set',
        xCacheHit: xCacheHit === 'true',
        age: age ? parseInt(age, 10) : 0,
      },
      
      // Vercel-specific cache info
      vercel: {
        cache: xVercelCache || 'not-set',
        id: xVercelId || 'not-set',
        region: process.env.VERCEL_REGION || 'not-set',
      },
      
      // Cache configuration
      config: {
        staticAssets: {
          strategy: 'immutable',
          maxAge: 31536000, // 1 year in seconds
          coverage: 'js, css, images, fonts',
        },
        apiRoutes: {
          strategy: 'stale-while-revalidate',
          sMaxAge: 10,
          staleWhileRevalidate: 59,
        },
        debugEndpoints: {
          strategy: 'no-cache',
          description: 'Debug endpoints are never cached',
        },
      },
      
      // Performance targets
      targets: {
        cacheHitRate: '80%+',
        staticAssetsCached: '100%',
        apiResponseTime: '<200ms with cache',
        staleServeTime: '<50ms',
      },
      
      // Cache headers by route type
      routeHeaders: {
        '/api/test': 'public, s-maxage=10, stale-while-revalidate=59',
        '/api/roles': 'public, s-maxage=60, stale-while-revalidate=300',
        '/api/debug/*': 'no-cache, no-store, must-revalidate',
        '/_next/static/*': 'public, max-age=31536000, immutable',
        '/*.{js,css}': 'public, max-age=31536000, immutable',
        '/images/*': 'public, max-age=31536000, immutable',
      },
      
      // Cache invalidation info
      invalidation: {
        method: 'revalidateTag',
        tags: [
          'users',
          'roles',
          'profiles',
          'user-roles',
          'all',
        ],
        description: 'Use revalidateCache() from lib/cache to invalidate',
      },
      
      // Optimization tips
      recommendations: [
        'Static assets are cached for 1 year with immutable flag',
        'API routes use stale-while-revalidate for optimal performance',
        'Debug endpoints are never cached for security',
        'Use cache tags for granular invalidation',
        'Monitor x-vercel-cache header for cache hit/miss',
      ],
    };
    
    return NextResponse.json(cacheStats, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Stats': 'true',
      },
    });
    
  } catch (error) {
    logger.error('Cache stats endpoint error', error as Error);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Cache stats endpoint error',
        error: errorMessage,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}