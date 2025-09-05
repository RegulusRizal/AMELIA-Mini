import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cryptographically secure UUID function for Edge Runtime
const randomUUID = () => {
  // Use Web Crypto API available in Edge Runtime
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback with crypto.getRandomValues() for better randomness
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  // Set version (4) and variant bits
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  // Convert to UUID string format
  const hex: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      hex.push('-');
    }
    hex.push(arr[i].toString(16).padStart(2, '0'));
  }
  return hex.join('');
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = randomUUID();

  try {
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
          // Update cookies on existing request object
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Update cookies on existing response object without recreating it
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Delete cookie from request
          request.cookies.delete(name)
          // Remove cookie from response by setting maxAge to 0
          response.cookies.set({
            name,
            value: '',
            maxAge: 0,
            expires: new Date(0),
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this is important!
  let user = null;
  
  try {
    // Only get user - no need for redundant getSession() call
    const userResult = await supabase.auth.getUser();
    user = userResult.data?.user;
  } catch (error) {
    // Log the error but don't crash - allow request to continue
    // In production, only log errors and critical warnings
    if (process.env.NODE_ENV === 'development' || error instanceof Error) {
      console.error('Auth operation failed in middleware', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        path: request.nextUrl.pathname
      });
    }
    // Gracefully degrade - treat as unauthenticated
    user = null;
  }

  // Protected routes
  const protectedPaths = ['/dashboard', '/users', '/hr', '/inventory', '/pos', '/finance'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    if (!user) {
      console.warn('Unauthorized access attempt to protected route', {
        path: request.nextUrl.pathname,
        requestId,
        statusCode: 401
      });
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // Log successful authentication (without PII in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Authenticated request', {
        userId: user.id,
        path: request.nextUrl.pathname,
        requestId
      });
    }
  }

  // Redirect to dashboard if user is logged in and tries to access login page
  if (request.nextUrl.pathname.startsWith('/auth/login')) {
    if (user) {
      // Don't log PII in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Redirecting authenticated user from login to dashboard', {
          userId: user.id,
          requestId
        });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Log request completion with performance metrics
  const duration = Date.now() - startTime;
  
  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow request detected: ${duration}ms`, {
      duration,
      path: request.nextUrl.pathname,
      requestId,
      statusCode: response.status
    });
  } else if (duration > 500) {
    // Only log medium-slow requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Request completed in ${duration}ms`, {
        duration,
        path: request.nextUrl.pathname,
        requestId,
        statusCode: response.status
      });
    }
  }

  return response
  } catch (error) {
    // If anything fails catastrophically, return a basic response to keep the app running
    console.error('Critical middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      // Only include stack traces in development to prevent information disclosure
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      path: request.nextUrl.pathname,
      requestId
    });
    
    // Return a basic NextResponse without any modifications
    // This ensures the request can continue even if middleware fails
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}