import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Logger } from '@/lib/logging/service'
import { randomUUID } from 'crypto'

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = randomUUID();
  
  // Create logger with request context
  const logger = new Logger({
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    metadata: {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }
  });

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Add request ID to response headers for tracing
  response.headers.set('X-Request-Id', requestId);
  
  // Add caching headers for static assets
  const pathname = request.nextUrl.pathname;
  
  // Static assets - cache for 1 year
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|eot|otf)$/i) ||
    pathname.startsWith('/_next/static/')
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // CSS and JS files - cache for 1 year
  if (pathname.match(/\.(css|js)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // API routes - use stale-while-revalidate
  if (pathname.startsWith('/api/')) {
    // Debug endpoints should not be cached
    if (pathname.includes('debug')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    } else if (pathname.startsWith('/api/roles')) {
      // Roles can be cached longer as they don't change often
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    } else {
      // Default API caching
      response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');
    }
  }
  
  // Add security headers while we're at it
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this is important!
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/users', '/hr', '/inventory', '/pos', '/finance'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    if (!user) {
      logger.warn('Unauthorized access attempt to protected route', {
        userId: undefined,
        statusCode: 401
      });
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // Log successful authentication
    logger.debug('Authenticated request', {
      userId: user.id
    });
  }

  // Redirect to dashboard if user is logged in and tries to access login page
  if (request.nextUrl.pathname.startsWith('/auth/login')) {
    if (user) {
      logger.debug('Redirecting authenticated user from login to dashboard', {
        userId: user.id
      });
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Log request completion with performance metrics
  const duration = Date.now() - startTime;
  
  // Log slow requests
  if (duration > 1000) {
    logger.warn(`Slow request detected: ${duration}ms`, {
      duration,
      statusCode: response.status
    });
  } else {
    logger.debug(`Request completed in ${duration}ms`, {
      duration,
      statusCode: response.status
    });
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}