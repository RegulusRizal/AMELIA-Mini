import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(10);
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    // Check roles table
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    
    // Check user_roles table
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    // Run a simple query to check if tables exist
    const tableCheck = {
      profiles: profilesError?.message || 'OK',
      roles: rolesError?.message || 'OK',
      user_roles: userRolesError?.message || 'OK'
    };
    
    return NextResponse.json({
      currentUser: user,
      tableStatus: tableCheck,
      profiles: profiles || [],
      profilesError: profilesError?.message,
      roles: roles || [],
      rolesError: rolesError?.message,
      userRoles: userRoles || [],
      userRolesError: userRolesError?.message,
      profilesCount: profiles?.length || 0,
      rolesCount: roles?.length || 0,
      userRolesCount: userRoles?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}