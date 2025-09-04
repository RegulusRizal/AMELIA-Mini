import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/helpers';

export async function GET() {
  try {
    // Check if user is super_admin
    const isSuperAdmin = await checkSuperAdmin();
    
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const supabase = await createClient();
    
    // Get all roles
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ roles: roles || [] });
    
  } catch (error) {
    console.error('Error in roles API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}