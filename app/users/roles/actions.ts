'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { revalidatePath } from 'next/cache';

// Role CRUD operations
export async function createRole(formData: FormData) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const name = formData.get('name') as string;
  const displayName = formData.get('display_name') as string;
  const description = formData.get('description') as string;
  const moduleId = formData.get('module_id') as string;
  const priority = parseInt(formData.get('priority') as string) || 0;
  
  // Validate unique name within module scope
  const { data: existing } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', name)
    .eq('module_id', moduleId || null)
    .single();
  
  if (existing) {
    return { error: 'Role with this name already exists in this scope' };
  }
  
  // Create the role
  const { data: role, error } = await adminClient
    .from('roles')
    .insert({
      name,
      display_name: displayName,
      description,
      module_id: moduleId || null,
      priority,
      is_system: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating role:', error);
    return { error: error.message };
  }
  
  // Log the action
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'role_created',
    module: 'user_management',
    resource_type: 'role',
    resource_id: role.id,
    changes: { name, display_name: displayName },
    created_at: new Date().toISOString(),
  });
  
  revalidatePath('/users/roles');
  return { success: true, role };
}

export async function updateRole(roleId: string, formData: FormData) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const displayName = formData.get('display_name') as string;
  const description = formData.get('description') as string;
  const priority = parseInt(formData.get('priority') as string) || 0;
  
  // Check if role exists and is not a system role
  const { data: existingRole } = await adminClient
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();
  
  if (!existingRole) {
    return { error: 'Role not found' };
  }
  
  if (existingRole.is_system) {
    return { error: 'Cannot modify system roles' };
  }
  
  // Update the role
  const { error } = await adminClient
    .from('roles')
    .update({
      display_name: displayName,
      description,
      priority,
    })
    .eq('id', roleId);
  
  if (error) {
    console.error('Error updating role:', error);
    return { error: error.message };
  }
  
  // Log the action
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'role_updated',
    module: 'user_management',
    resource_type: 'role',
    resource_id: roleId,
    changes: { 
      old: { 
        display_name: existingRole.display_name, 
        description: existingRole.description,
        priority: existingRole.priority 
      },
      new: { display_name: displayName, description, priority }
    },
    created_at: new Date().toISOString(),
  });
  
  revalidatePath('/users/roles');
  return { success: true };
}

export async function deleteRole(roleId: string) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if role exists and is not a system role
  const { data: role } = await adminClient
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();
  
  if (!role) {
    return { error: 'Role not found' };
  }
  
  if (role.is_system) {
    return { error: 'Cannot delete system roles' };
  }
  
  // Check if any users have this role
  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('role_id', roleId);
  
  if (userRoles && userRoles.length > 0) {
    return { 
      error: `Cannot delete role. ${userRoles.length} user(s) have this role assigned.`,
      userCount: userRoles.length 
    };
  }
  
  // Delete the role (cascades to role_permissions)
  const { error } = await adminClient
    .from('roles')
    .delete()
    .eq('id', roleId);
  
  if (error) {
    console.error('Error deleting role:', error);
    return { error: error.message };
  }
  
  // Log the action
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'role_deleted',
    module: 'user_management',
    resource_type: 'role',
    resource_id: roleId,
    changes: { deleted_role: role },
    created_at: new Date().toISOString(),
  });
  
  revalidatePath('/users/roles');
  return { success: true };
}

// Permission management
export async function getRolePermissions(roleId: string) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  
  // Get all permissions for the role
  const { data: rolePermissions, error } = await adminClient
    .from('role_permissions')
    .select(`
      permission:permissions(
        id,
        module_id,
        resource,
        action,
        description,
        module:modules(
          name,
          display_name
        )
      )
    `)
    .eq('role_id', roleId);
  
  if (error) {
    console.error('Error fetching role permissions:', error);
    return { error: error.message };
  }
  
  return { permissions: rolePermissions?.map(rp => rp.permission).flat() || [] };
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if role exists
  const { data: role } = await adminClient
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();
  
  if (!role) {
    return { error: 'Role not found' };
  }
  
  // Don't allow removing all permissions from super_admin
  if (role.name === 'super_admin' && permissionIds.length === 0) {
    return { error: 'Cannot remove all permissions from super_admin role' };
  }
  
  // Get current permissions
  const { data: currentPermissions } = await adminClient
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', roleId);
  
  const currentPermissionIds = currentPermissions?.map(cp => cp.permission_id) || [];
  
  // Calculate additions and removals
  const toAdd = permissionIds.filter(id => !currentPermissionIds.includes(id));
  const toRemove = currentPermissionIds.filter(id => !permissionIds.includes(id));
  
  // Remove old permissions
  if (toRemove.length > 0) {
    const { error: deleteError } = await adminClient
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .in('permission_id', toRemove);
    
    if (deleteError) {
      console.error('Error removing permissions:', deleteError);
      return { error: deleteError.message };
    }
  }
  
  // Add new permissions
  if (toAdd.length > 0) {
    const newPermissions = toAdd.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId,
      granted_at: new Date().toISOString(),
    }));
    
    const { error: insertError } = await adminClient
      .from('role_permissions')
      .insert(newPermissions);
    
    if (insertError) {
      console.error('Error adding permissions:', insertError);
      return { error: insertError.message };
    }
  }
  
  // Log the action
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'role_permissions_updated',
    module: 'user_management',
    resource_type: 'role',
    resource_id: roleId,
    changes: { 
      added: toAdd.length,
      removed: toRemove.length,
      total: permissionIds.length 
    },
    created_at: new Date().toISOString(),
  });
  
  revalidatePath('/users/roles');
  return { success: true };
}

export async function getAvailablePermissions() {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  
  // Get all permissions grouped by module
  const { data: permissions, error } = await adminClient
    .from('permissions')
    .select(`
      id,
      module_id,
      resource,
      action,
      description,
      module:modules(
        id,
        name,
        display_name
      )
    `)
    .order('module_id')
    .order('resource')
    .order('action');
  
  if (error) {
    console.error('Error fetching permissions:', error);
    return { error: error.message };
  }
  
  // Group permissions by module
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    const module = Array.isArray(perm.module) ? perm.module[0] : perm.module;
    const moduleName = module?.display_name || 'Global';
    if (!acc[moduleName]) {
      acc[moduleName] = [];
    }
    acc[moduleName].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>) || {};
  
  return { permissions: groupedPermissions };
}

// Utility functions
export async function getRoleUsers(roleId: string) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  
  const { data: userRoles, error } = await adminClient
    .from('user_roles')
    .select(`
      user:profiles(
        id,
        email,
        display_name,
        first_name,
        last_name
      ),
      assigned_at,
      expires_at
    `)
    .eq('role_id', roleId);
  
  if (error) {
    console.error('Error fetching role users:', error);
    return { error: error.message };
  }
  
  return { users: userRoles?.map(ur => ({
    ...ur.user,
    assigned_at: ur.assigned_at,
    expires_at: ur.expires_at
  })) || [] };
}

export async function duplicateRole(roleId: string, newName: string) {
  await requireSuperAdmin();
  
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get the original role
  const { data: originalRole } = await adminClient
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();
  
  if (!originalRole) {
    return { error: 'Role not found' };
  }
  
  // Check if new name already exists
  const { data: existing } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', newName)
    .eq('module_id', originalRole.module_id)
    .single();
  
  if (existing) {
    return { error: 'Role with this name already exists' };
  }
  
  // Create the new role
  const { data: newRole, error: createError } = await adminClient
    .from('roles')
    .insert({
      name: newName,
      display_name: `${originalRole.display_name} (Copy)`,
      description: originalRole.description,
      module_id: originalRole.module_id,
      priority: originalRole.priority,
      is_system: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (createError) {
    console.error('Error duplicating role:', createError);
    return { error: createError.message };
  }
  
  // Copy permissions
  const { data: originalPermissions } = await adminClient
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', roleId);
  
  if (originalPermissions && originalPermissions.length > 0) {
    const newPermissions = originalPermissions.map(op => ({
      role_id: newRole.id,
      permission_id: op.permission_id,
      granted_at: new Date().toISOString(),
    }));
    
    const { error: permError } = await adminClient
      .from('role_permissions')
      .insert(newPermissions);
    
    if (permError) {
      console.error('Error copying permissions:', permError);
      // Continue anyway, role is created
    }
  }
  
  // Log the action
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'role_duplicated',
    module: 'user_management',
    resource_type: 'role',
    resource_id: newRole.id,
    changes: { 
      original_role_id: roleId,
      new_role_name: newName 
    },
    created_at: new Date().toISOString(),
  });
  
  revalidatePath('/users/roles');
  return { success: true, role: newRole };
}