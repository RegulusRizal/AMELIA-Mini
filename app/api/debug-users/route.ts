import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/helpers';
import { createApiLogger } from '@/lib/logging';

export async function GET(request: Request) {
  const logger = createApiLogger(request, { module: 'api', action: 'debug-users' });
  // Add production check FIRST
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Check if user is super_admin
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get current user first (needed for auth context)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Parallelize all database queries for better performance
    const [
      authUsersResult,
      profilesResult,
      rolesResult,
      userRolesResult
    ] = await Promise.all([
      // Use admin client to list auth users
      adminClient.auth.admin.listUsers({ 
        page: 1,
        perPage: 10 
      }),
      // Check profiles table
      supabase
        .from('profiles')
        .select('*')
        .limit(10),
      // Check roles table
      supabase
        .from('roles')
        .select('*'),
      // Check user_roles table
      supabase
        .from('user_roles')
        .select('*')
        .limit(100)
    ]);

    // Destructure results
    const { data: { users: authUsers }, error: authError } = authUsersResult;
    const { data: profiles, error: profilesError } = profilesResult;
    const { data: roles, error: rolesError } = rolesResult;
    const { data: userRoles, error: userRolesError } = userRolesResult;
    
    // Run a simple query to check if tables exist
    const tableCheck = {
      profiles: profilesError?.message || 'OK',
      roles: rolesError?.message || 'OK',
      user_roles: userRolesError?.message || 'OK'
    };
    
    // Minimal debug info - no PII
    return NextResponse.json({
      status: 'ok',
      counts: {
        authUsers: authUsers?.length || 0,
        profiles: profiles?.length || 0,
        roles: roles?.length || 0,
        userRoles: userRoles?.length || 0
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    logger.error('Debug-users endpoint error', error as Error);
    
    // Generic error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'An unexpected error occurred';
    
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      message: errorMessage
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}