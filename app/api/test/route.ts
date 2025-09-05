import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
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
    
    // Test the connection by fetching the current user (if any)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Test database connection (assuming you have a 'profiles' table)
    // Modify this based on your actual database schema
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    // Minimal test info - no sensitive data
    const response = {
      status: 'success',
      message: 'Successfully connected to Supabase!',
      timestamp: new Date().toISOString(),
      auth: {
        connected: !userError,
        hasUser: !!user
      },
      database: {
        connected: !dbError
      }
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    // Generic error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: errorMessage
      },
      { status: 500 }
    )
  }
}