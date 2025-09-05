// User Management Data Queries
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import type { 
  UserProfile, 
  Role, 
  Permission, 
  UserRole,
  Module,
  UserType,
  ActivityLog,
  PaginatedResponse,
  UserFilterParams,
  RoleFilterParams,
  UserPermissions
} from './types';

// =====================================================
// USER QUERIES
// =====================================================

export async function getUsers(params: UserFilterParams = {}): Promise<PaginatedResponse<UserProfile>> {
  const supabase = await createClient();
  
  const {
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc',
    search,
    status,
    user_type_id,
    has_employee_id,
    role_id
  } = params;
  
  // Build query with proper joins when needed
  let selectClause = '*';
  
  // If filtering by role, we need to join user_roles table
  if (role_id) {
    selectClause = '*, user_roles!inner(role_id)';
  }
  
  let query = supabase
    .from('profiles')
    .select(selectClause, { count: 'exact' });
  
  // Apply filters
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_id.ilike.%${search}%`);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (user_type_id) {
    query = query.eq('user_type_id', user_type_id);
  }
  
  if (has_employee_id !== undefined) {
    if (has_employee_id) {
      query = query.not('employee_id', 'is', null);
    } else {
      query = query.is('employee_id', null);
    }
  }
  
  if (role_id) {
    query = query.eq('user_roles.role_id', role_id);
  }
  
  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });
  
  // Apply pagination
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  query = query.range(start, end);
  
  const { data, error, count } = await query;
  
  if (error) {
    logger.error('Failed to fetch users', error as Error, {
      module: 'user-management',
      action: 'getUsers',
      params
    });
    // Return empty response instead of throwing to prevent page crash
    return {
      data: [],
      total: 0,
      page,
      limit,
      total_pages: 0
    };
  }
  
  return {
    data: (data as unknown as UserProfile[]) || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit)
  };
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_type:user_types(*),
      user_roles(
        *,
        role:roles(
          *,
          role_permissions(
            permission:permissions(*)
          )
        )
      )
    `)
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
  
  return data as UserProfile;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  return getUserById(user.id);
}

// =====================================================
// ROLE QUERIES
// =====================================================

export async function getRoles(params: RoleFilterParams = {}): Promise<PaginatedResponse<Role>> {
  const supabase = await createClient();
  
  const {
    page = 1,
    limit = 20,
    sort_by = 'priority',
    sort_order = 'desc',
    search,
    module_id,
    is_system
  } = params;
  
  let query = supabase
    .from('roles')
    .select(`
      *,
      module:modules(*),
      role_permissions(
        permission:permissions(*)
      )
    `, { count: 'exact' });
  
  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  if (module_id !== undefined) {
    if (module_id === null) {
      query = query.is('module_id', null);
    } else {
      query = query.eq('module_id', module_id);
    }
  }
  
  if (is_system !== undefined) {
    query = query.eq('is_system', is_system);
  }
  
  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });
  
  // Apply pagination
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  query = query.range(start, end);
  
  const { data, error, count } = await query;
  
  if (error) {
    logger.error('Failed to fetch roles', error as Error, {
      module: 'user-management',
      action: 'getRoles',
      params
    });
    // Return empty response instead of throwing to prevent page crash
    return {
      data: [],
      total: 0,
      page,
      limit,
      total_pages: 0
    };
  }
  
  return {
    data: data as Role[] || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit)
  };
}

export async function getRoleById(roleId: string): Promise<Role | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select(`
      *,
      module:modules(*),
      role_permissions(
        permission:permissions(*)
      )
    `)
    .eq('id', roleId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch role: ${error.message}`);
  }
  
  return data as Role;
}

// =====================================================
// PERMISSION QUERIES
// =====================================================

export async function getPermissions(moduleId?: string): Promise<Permission[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('permissions')
    .select(`
      *,
      module:modules(*)
    `);
  
  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch permissions: ${error.message}`);
  }
  
  return data as Permission[];
}

export async function getUserPermissions(userId?: string): Promise<UserPermissions> {
  const supabase = await createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { modules: {} };
    }
    userId = user.id;
  }
  
  const { data, error } = await supabase.rpc('get_user_permissions', {
    p_user_id: userId
  });
  
  if (error) {
    throw new Error(`Failed to fetch user permissions: ${error.message}`);
  }
  
  // Transform flat list to nested structure
  const permissions: UserPermissions = { modules: {} };
  
  data?.forEach((perm: any) => {
    if (!permissions.modules[perm.module_name]) {
      permissions.modules[perm.module_name] = {};
    }
    if (!permissions.modules[perm.module_name][perm.resource]) {
      permissions.modules[perm.module_name][perm.resource] = [];
    }
    permissions.modules[perm.module_name][perm.resource].push(perm.action);
  });
  
  return permissions;
}

export async function checkPermission(
  module: string, 
  resource: string, 
  action: string,
  userId?: string
): Promise<boolean> {
  const supabase = await createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  const { data, error } = await supabase.rpc('has_permission', {
    p_module: module,
    p_resource: resource,
    p_action: action,
    p_user_id: userId
  });
  
  if (error) {
    logger.error('Permission check failed', error as Error, {
      module: 'user-management',
      action: 'checkPermission',
      permission: { module, resource, action },
      userId
    });
    return false;
  }
  
  return data === true;
}

// =====================================================
// MODULE QUERIES
// =====================================================

export async function getModules(): Promise<Module[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('display_name');
  
  if (error) {
    throw new Error(`Failed to fetch modules: ${error.message}`);
  }
  
  return data as Module[];
}

export async function canAccessModule(moduleName: string, userId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  const { data, error } = await supabase.rpc('can_access_module', {
    p_module_name: moduleName,
    p_user_id: userId
  });
  
  if (error) {
    logger.error('Module access check failed', error as Error, {
      module: 'user-management',
      action: 'canAccessModule',
      moduleName,
      userId
    });
    return false;
  }
  
  return data === true;
}

// =====================================================
// USER TYPE QUERIES
// =====================================================

export async function getUserTypes(): Promise<UserType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_types')
    .select('*')
    .order('display_name');
  
  if (error) {
    logger.error('Failed to fetch user types', error as Error, {
      module: 'user-management',
      action: 'getUserTypes'
    });
    // Return empty array instead of throwing to prevent page crash
    return [];
  }
  
  return data as UserType[] || [];
}

// =====================================================
// ACTIVITY LOG QUERIES
// =====================================================

export async function getActivityLogs(
  userId?: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('activity_logs')
    .select(`
      *,
      user:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch activity logs: ${error.message}`);
  }
  
  return data as ActivityLog[];
}

// =====================================================
// USER ROLE QUERIES
// =====================================================

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      role:roles(
        *,
        module:modules(*),
        role_permissions(
          permission:permissions(*)
        )
      )
    `)
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch user roles: ${error.message}`);
  }
  
  return data as UserRole[];
}