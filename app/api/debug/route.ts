import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { checkSuperAdmin } from '@/lib/auth/helpers'

export async function GET() {
  // Check if user is super_admin
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

    const debugInfo = {
      status: 'debug',
      timestamp: new Date().toISOString(),
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      session: {
        exists: !!session,
        error: sessionError?.message || null,
        expiresAt: session?.expires_at || null,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
      },
      user: {
        exists: !!user,
        error: userError?.message || null,
        id: user?.id || null,
        email: user?.email || null,
        createdAt: user?.created_at || null,
        lastSignInAt: user?.last_sign_in_at || null,
      },
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
        }))
      },
      troubleshooting: {
        sessionButNoUser: !!session && !user,
        userButNoSession: !!user && !session,
        neitherSessionNorUser: !session && !user,
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Debug endpoint error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}