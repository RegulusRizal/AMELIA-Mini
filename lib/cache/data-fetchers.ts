/**
 * Cached data fetchers for server components
 * These functions use Next.js caching to reduce database calls
 */

import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_DURATIONS } from './index';
import { logger } from '@/lib/logging';

/**
 * Function to get all users (temporarily without caching to fix global cache issues)
 */
export const getCachedUsers = async () => {
  const supabase = await createClient();
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles(
        role_id,
        roles(
          id,
          name,
          description,
          priority
        )
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error('Error fetching cached users', error as Error, {
      module: 'cache',
      action: 'getCachedUsers'
    });
    return [];
  }
  
  return users || [];
};

/**
 * Function to get a single user by ID (temporarily without caching to fix global cache issues)
 */
export const getCachedUser = async (userId: string) => {
  const supabase = await createClient();
  
  const { data: user, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles(
        role_id,
        roles(
          id,
          name,
          description,
          priority
        )
      )
    `)
    .eq('id', userId)
    .single();
  
  if (error) {
    logger.error('Error fetching cached user', error as Error, {
      module: 'cache',
      action: 'getCachedUser',
      userId
    });
    return null;
  }
  
  return user;
};

/**
 * Cached function to get all roles
 */
export const getCachedRoles = unstable_cache(
  async () => {
    const supabase = await createClient();
    
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) {
      logger.error('Error fetching cached roles', error as Error, {
        module: 'cache',
        action: 'getCachedRoles'
      });
      return [];
    }
    
    return roles || [];
  },
  ['get-roles'], // Cache key
  {
    tags: [CACHE_TAGS.ROLES],
    revalidate: CACHE_DURATIONS.HALF_HOUR, // Roles change less frequently
  }
);

/**
 * Cached function to get role by ID
 */
export const getCachedRole = unstable_cache(
  async (roleId: string) => {
    const supabase = await createClient();
    
    const { data: role, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission_id,
          permissions(*)
        )
      `)
      .eq('id', roleId)
      .single();
    
    if (error) {
      logger.error('Error fetching cached role', error as Error, {
        module: 'cache',
        action: 'getCachedRole',
        metadata: { roleId }
      });
      return null;
    }
    
    return role;
  },
  ['get-role'], // Cache key prefix
  {
    tags: [CACHE_TAGS.ROLES],
    revalidate: CACHE_DURATIONS.HALF_HOUR,
  }
);

/**
 * Cached function to get user permissions
 */
export const getCachedUserPermissions = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient();
    
    // First get user's roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);
    
    if (rolesError || !userRoles?.length) {
      return [];
    }
    
    const roleIds = userRoles.map(ur => ur.role_id);
    
    // Then get permissions for those roles
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        permissions(
          id,
          name,
          resource,
          action,
          description
        )
      `)
      .in('role_id', roleIds);
    
    if (permError) {
      logger.error('Error fetching cached permissions', permError as Error, {
        module: 'cache',
        action: 'getCachedUserPermissions',
        userId
      });
      return [];
    }
    
    // Flatten and deduplicate permissions
    const uniquePermissions = new Map();
    permissions?.forEach((rp: any) => {
      if (rp.permissions && rp.permissions.id) {
        uniquePermissions.set(rp.permissions.id, rp.permissions);
      }
    });
    
    return Array.from(uniquePermissions.values());
  },
  ['get-user-permissions'], // Cache key prefix
  {
    tags: [CACHE_TAGS.USER_ROLES],
    revalidate: CACHE_DURATIONS.FIVE_MINUTES,
  }
);

/**
 * Cached function to check if user has specific permission
 */
export const getCachedUserHasPermission = unstable_cache(
  async (userId: string, resource: string, action: string) => {
    const permissions = await getCachedUserPermissions(userId);
    
    return permissions.some(
      p => p.resource === resource && p.action === action
    );
  },
  ['user-has-permission'], // Cache key prefix
  {
    tags: [CACHE_TAGS.USER_ROLES],
    revalidate: CACHE_DURATIONS.FIVE_MINUTES,
  }
);

/**
 * Cached function to get dashboard stats
 */
export const getCachedDashboardStats = unstable_cache(
  async () => {
    const supabase = await createClient();
    
    // Parallel fetch for better performance
    const [
      usersResult,
      rolesResult,
      activeSessionsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('roles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles')
        .select('last_sign_in_at')
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);
    
    return {
      totalUsers: usersResult.count || 0,
      totalRoles: rolesResult.count || 0,
      activeSessions: activeSessionsResult.data?.length || 0,
      lastUpdated: new Date().toISOString(),
    };
  },
  ['dashboard-stats'], // Cache key
  {
    tags: [CACHE_TAGS.ALL],
    revalidate: CACHE_DURATIONS.MINUTE, // Update frequently for dashboard
  }
);

/**
 * Function for profile autocomplete/search (temporarily without caching to fix global cache issues)
 */
export const getCachedProfileSearch = async (query: string) => {
  const supabase = await createClient();
  
  // Sanitize query to prevent SQL injection
  const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, email, avatar_url')
    .or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
    .limit(10);
  
  if (error) {
    logger.error('Error searching profiles', error as Error, {
      module: 'cache',
      action: 'getCachedProfileSearch',
      metadata: { query }
    });
    return [];
  }
  
  return profiles || [];
};

// Export all cached functions
export default {
  getCachedUsers,
  getCachedUser,
  getCachedRoles,
  getCachedRole,
  getCachedUserPermissions,
  getCachedUserHasPermission,
  getCachedDashboardStats,
  getCachedProfileSearch,
};