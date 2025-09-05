import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    // Generic error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}

export async function GET(request: Request) {
  return POST(request)
}