import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with service role privileges
 * WARNING: This bypasses RLS - use only in secure server-side contexts
 * NEVER expose this client or the service role key to the client side
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Create client with service role key - this bypasses RLS
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Creates an admin client and verifies the requesting user is a super_admin
 * Throws an error if the user is not authorized
 */
export async function createSecureAdminClient(userId: string) {
  const adminClient = createAdminClient()
  
  // Verify the user has super_admin role
  const { data: userRoles, error } = await adminClient
    .from('user_roles')
    .select(`
      role:roles(
        name
      )
    `)
    .eq('user_id', userId)
  
  if (error || !userRoles) {
    throw new Error('Failed to verify user permissions')
  }
  
  const isSuperAdmin = userRoles.some(ur => {
    const role = ur.role as any
    return role && !Array.isArray(role) && role.name === 'super_admin'
  })
  
  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Admin privileges required')
  }
  
  return adminClient
}