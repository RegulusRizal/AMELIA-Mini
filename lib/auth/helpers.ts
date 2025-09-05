import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logging';

/**
 * Check if the current user has the super_admin role
 */
export async function checkSuperAdmin() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return false;
  }
  
  // Check if user has super_admin role
  const { data: userRoles, error: roleError } = await supabase
    .from('user_roles')
    .select(`
      role:roles(
        id,
        name,
        display_name
      )
    `)
    .eq('user_id', user.id);
  
  if (roleError || !userRoles || userRoles.length === 0) {
    return false;
  }
  
  // Check if any role is super_admin
  return userRoles.some(ur => {
    const role = ur.role as any;
    return role && !Array.isArray(role) && role.name === 'super_admin';
  });
}

/**
 * Get the current user's roles
 */
export async function getUserRoles(userId?: string) {
  const supabase = await createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }
  
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select(`
      role:roles(
        id,
        name,
        display_name,
        description
      )
    `)
    .eq('user_id', userId);
  
  if (error || !userRoles) {
    logger.error('Error fetching user roles', error as Error, {
      module: 'auth',
      action: 'getUserRoles',
      userId
    });
    return [];
  }
  
  return userRoles.map(ur => ur.role).filter(Boolean);
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  permission: string,
  resource: string,
  userId?: string
): Promise<boolean> {
  const supabase = await createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  // Check if user has permission through their roles
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role:roles(
        role_permissions(
          permission:permissions(
            action,
            resource
          )
        )
      )
    `)
    .eq('user_id', userId);
  
  if (error || !data) {
    logger.error('Error checking permission', error as Error, {
      module: 'auth',
      action: 'hasPermission',
      userId,
      metadata: { permission, resource }
    });
    return false;
  }
  
  // Check if any role has the required permission
  for (const userRole of data) {
    const role = userRole.role as any;
    if (!role) continue;
    const rolePerms = role.role_permissions || [];
    for (const rp of rolePerms) {
      const perm = rp.permission as any;
      if (perm && !Array.isArray(perm) && perm.action === permission && perm.resource === resource) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Require super_admin role or redirect
 */
export async function requireSuperAdmin() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    redirect('/dashboard?error=unauthorized');
  }
}

/**
 * Get all available roles from the database
 */
export async function getAllRoles() {
  const supabase = await createClient();
  
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('priority', { ascending: false });
  
  if (error) {
    logger.error('Error fetching roles', error as Error, {
      module: 'auth',
      action: 'getAllRoles'
    });
    return [];
  }
  
  return roles || [];
}