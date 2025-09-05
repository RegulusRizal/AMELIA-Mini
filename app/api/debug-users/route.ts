import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/helpers';

export async function GET() {
  // Check if user is super_admin
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use admin client to list auth users
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers({ 
      page: 1,
      perPage: 10 
    });
    
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
      authUsers: authUsers?.map(u => ({ id: u.id, email: u.email })) || [],
      authUsersError: authError?.message,
      tableStatus: tableCheck,
      profiles: profiles || [],
      profilesError: profilesError?.message,
      roles: roles || [],
      rolesError: rolesError?.message,
      userRoles: userRoles || [],
      userRolesError: userRolesError?.message,
      authUsersCount: authUsers?.length || 0,
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