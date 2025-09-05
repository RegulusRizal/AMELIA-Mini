import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkSuperAdmin } from '@/lib/auth/helpers'

export async function GET() {
  // Check if user is super_admin
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
    
    const response = {
      status: 'success',
      message: 'Successfully connected to Supabase!',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
      auth: {
        connected: !userError,
        user: user?.email || 'No user logged in'
      },
      database: {
        connected: !dbError,
        error: dbError ? String(dbError) : null
      }
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}