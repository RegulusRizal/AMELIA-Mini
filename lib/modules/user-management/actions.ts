// User Management Server Actions
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  ApiResponse,
  UserProfile,
  Role
} from './types';
import { 
  createUserSchema, 
  updateUserSchema, 
  createRoleSchema, 
  updateRoleSchema,
  assignRoleSchema 
} from './schemas';

// =====================================================
// USER ACTIONS
// =====================================================

export async function createUser(input: CreateUserInput): Promise<ApiResponse<UserProfile>> {
  try {
    const supabase = await createClient();
    
    // Validate input
    const validatedData = createUserSchema.parse(input);
    
    // Check if current user has permission
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return { error: 'Not authenticated' };
    }
    
    // Create auth user if password provided
    let authUserId: string;
    if (validatedData.password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true
      });
      
      if (authError) {
        return { error: authError.message };
      }
      
      authUserId = authData.user.id;
    } else {
      // Send invite email
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        validatedData.email
      );
      
      if (authError) {
        return { error: authError.message };
      }
      
      authUserId = authData.user.id;
    }
    
    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        display_name: validatedData.display_name,
        phone: validatedData.phone,
        employee_id: validatedData.employee_id,
        user_type_id: validatedData.user_type_id
      })
      .eq('id', authUserId)
      .select()
      .single();
    
    if (profileError) {
      return { error: profileError.message };
    }
    
    // Assign roles if provided
    if (validatedData.roles && validatedData.roles.length > 0) {
      const roleAssignments = validatedData.roles.map(roleId => ({
        user_id: authUserId,
        role_id: roleId,
        assigned_by: currentUser.user.id
      }));
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(roleAssignments);
      
      if (roleError) {
        console.error('Failed to assign roles:', roleError);
      }
    }
    
    // Log activity
    await logActivity({
      action: 'user_created',
      module: 'user_management',
      resource_type: 'user',
      resource_id: authUserId,
      changes: { email: validatedData.email }
    });
    
    revalidatePath('/users');
    return { data: profile as UserProfile, message: 'User created successfully' };
  } catch (error) {
    console.error('Create user error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<ApiResponse<UserProfile>> {
  try {
    const supabase = await createClient();
    
    // Validate input
    const validatedData = updateUserSchema.parse(input);
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Log activity
    await logActivity({
      action: 'user_updated',
      module: 'user_management',
      resource_type: 'user',
      resource_id: userId,
      changes: validatedData
    });
    
    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    return { data: data as UserProfile, message: 'User updated successfully' };
  } catch (error) {
    console.error('Update user error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update user' };
  }
}

export async function deleteUser(userId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    // Check permission
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return { error: 'Not authenticated' };
    }
    
    // Soft delete by setting status
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', userId);
    
    if (error) {
      return { error: error.message };
    }
    
    // Log activity
    await logActivity({
      action: 'user_deleted',
      module: 'user_management',
      resource_type: 'user',
      resource_id: userId
    });
    
    revalidatePath('/users');
    return { message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete user' };
  }
}

// =====================================================
// ROLE ACTIONS
// =====================================================

export async function createRole(input: CreateRoleInput): Promise<ApiResponse<Role>> {
  try {
    const supabase = await createClient();
    
    // Validate input
    const validatedData = createRoleSchema.parse(input);
    
    // Create role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: validatedData.name,
        display_name: validatedData.display_name,
        description: validatedData.description,
        module_id: validatedData.module_id
      })
      .select()
      .single();
    
    if (roleError) {
      return { error: roleError.message };
    }
    
    // Assign permissions if provided
    if (validatedData.permissions && validatedData.permissions.length > 0) {
      const permissionAssignments = validatedData.permissions.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }));
      
      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(permissionAssignments);
      
      if (permError) {
        console.error('Failed to assign permissions:', permError);
      }
    }
    
    // Log activity
    await logActivity({
      action: 'role_created',
      module: 'user_management',
      resource_type: 'role',
      resource_id: role.id,
      changes: { name: validatedData.name }
    });
    
    revalidatePath('/roles');
    return { data: role as Role, message: 'Role created successfully' };
  } catch (error) {
    console.error('Create role error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create role' };
  }
}

export async function updateRole(
  roleId: string,
  input: UpdateRoleInput
): Promise<ApiResponse<Role>> {
  try {
    const supabase = await createClient();
    
    // Validate input
    const validatedData = updateRoleSchema.parse(input);
    
    // Update role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .update({
        display_name: validatedData.display_name,
        description: validatedData.description
      })
      .eq('id', roleId)
      .select()
      .single();
    
    if (roleError) {
      return { error: roleError.message };
    }
    
    // Update permissions if provided
    if (validatedData.permissions) {
      // Remove existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      
      // Add new permissions
      if (validatedData.permissions.length > 0) {
        const permissionAssignments = validatedData.permissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }));
        
        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissionAssignments);
        
        if (permError) {
          console.error('Failed to update permissions:', permError);
        }
      }
    }
    
    // Log activity
    await logActivity({
      action: 'role_updated',
      module: 'user_management',
      resource_type: 'role',
      resource_id: roleId,
      changes: validatedData
    });
    
    revalidatePath('/roles');
    revalidatePath(`/roles/${roleId}`);
    return { data: role as Role, message: 'Role updated successfully' };
  } catch (error) {
    console.error('Update role error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update role' };
  }
}

export async function deleteRole(roleId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    // Check if role is system role
    const { data: role } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', roleId)
      .single();
    
    if (role?.is_system) {
      return { error: 'Cannot delete system role' };
    }
    
    // Delete role (cascade will handle permissions and assignments)
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);
    
    if (error) {
      return { error: error.message };
    }
    
    // Log activity
    await logActivity({
      action: 'role_deleted',
      module: 'user_management',
      resource_type: 'role',
      resource_id: roleId
    });
    
    revalidatePath('/roles');
    return { message: 'Role deleted successfully' };
  } catch (error) {
    console.error('Delete role error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete role' };
  }
}

// =====================================================
// USER ROLE ACTIONS
// =====================================================

export async function assignRole(input: AssignRoleInput): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    // Validate input
    const validatedData = assignRoleSchema.parse(input);
    
    // Get current user
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return { error: 'Not authenticated' };
    }
    
    // Assign role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: validatedData.user_id,
        role_id: validatedData.role_id,
        assigned_by: currentUser.user.id,
        expires_at: validatedData.expires_at,
        metadata: validatedData.metadata
      });
    
    if (error) {
      if (error.code === '23505') {
        return { error: 'User already has this role' };
      }
      return { error: error.message };
    }
    
    // Log activity
    await logActivity({
      action: 'role_assigned',
      module: 'user_management',
      resource_type: 'user_role',
      resource_id: validatedData.user_id,
      changes: { role_id: validatedData.role_id }
    });
    
    revalidatePath('/users');
    revalidatePath(`/users/${validatedData.user_id}`);
    return { message: 'Role assigned successfully' };
  } catch (error) {
    console.error('Assign role error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to assign role' };
  }
}

export async function revokeRole(userId: string, roleId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    // Revoke role
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .match({ user_id: userId, role_id: roleId });
    
    if (error) {
      return { error: error.message };
    }
    
    // Log activity
    await logActivity({
      action: 'role_revoked',
      module: 'user_management',
      resource_type: 'user_role',
      resource_id: userId,
      changes: { role_id: roleId }
    });
    
    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    return { message: 'Role revoked successfully' };
  } catch (error) {
    console.error('Revoke role error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to revoke role' };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function logActivity(params: {
  action: string;
  module?: string;
  resource_type?: string;
  resource_id?: string;
  changes?: any;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: params.action,
      module: params.module,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      changes: params.changes
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}