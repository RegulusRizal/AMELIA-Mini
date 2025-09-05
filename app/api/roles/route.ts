import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/auth/helpers';
import { createApiLogger } from '@/lib/logging';

export async function GET(request: Request) {
  const logger = createApiLogger(request, { module: 'api', action: 'roles' });
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
      logger.error('Error fetching roles', error as Error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { roles: roles || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
      }
    );
    
  } catch (error) {
    logger.error('Error in roles API', error as Error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}