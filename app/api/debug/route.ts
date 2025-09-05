import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { checkSuperAdmin } from '@/lib/auth/helpers'

export async function GET() {
  // Add production check FIRST
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  // Then check super_admin for non-production
  const isSuperAdmin = await checkSuperAdmin()
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    
    // Get session and user info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase')
    )

    // Minimal debug info - no PII or sensitive data
    const debugInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        hasSession: !!session,
        hasUser: !!user,
        hasAuthCookies: authCookies.length > 0,
        environment: process.env.NODE_ENV || 'unknown'
      },
      troubleshooting: {
        sessionButNoUser: !!session && !user,
        userButNoSession: !!user && !session,
        neitherSessionNorUser: !session && !user,
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    // Generic error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Debug endpoint error',
        error: errorMessage
      },
      { status: 500 }
    )
  }
}