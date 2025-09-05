'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, createSecureAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { generateSecurePassword } from '@/lib/utils/password-generator';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logging';

export async function createUser(formData: FormData) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Use admin client for creating users
  const adminClient = createAdminClient();
  
  const email = formData.get('email') as string;
  const displayName = formData.get('display_name') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const employeeId = formData.get('employee_id') as string;
  const status = formData.get('status') as string || 'active';
  const password = formData.get('password') as string || generateSecurePassword(12);
  const roleId = formData.get('role_id') as string;
  
  // Create user in Supabase Auth with admin privileges
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (authError) {
    logger.error('Error creating auth user', authError as Error, {
      module: 'users',
      action: 'createUser',
      metadata: { email }
    });
    return { error: authError.message };
  }
  
  // Update the profile that was auto-created by the trigger
  // Using upsert to handle both cases: trigger created it or not
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user!.id,
      email,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      phone,
      employee_id: employeeId || null,
      status,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });
  
  if (profileError) {
    logger.error('Error updating profile', profileError as Error, {
      module: 'users',
      action: 'createUser',
      userId: authData.user!.id,
      metadata: { email }
    });
    // Try to clean up auth user if profile update fails
    await adminClient.auth.admin.deleteUser(authData.user!.id);
    return { error: profileError.message };
  }
  
  // Assign role if one was selected (and not "no-role")
  if (roleId && roleId !== 'no-role') {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: authData.user!.id,
        role_id: roleId,
        assigned_by: currentUser?.id,
        assigned_at: new Date().toISOString(),
      });
    
    if (roleError) {
      logger.error('Error assigning role', roleError as Error, {
        module: 'users',
        action: 'createUser',
        userId: authData.user!.id,
        metadata: { roleId }
      });
      // User was created successfully, just role assignment failed
      // We don't delete the user in this case
    }
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function updateUser(userId: string, formData: FormData) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Use admin client to bypass RLS restrictions
  const adminClient = createAdminClient();
  
  const displayName = formData.get('display_name') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const employeeId = formData.get('employee_id') as string;
  const status = formData.get('status') as string;
  
  const { error } = await adminClient
    .from('profiles')
    .update({
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      phone,
      employee_id: employeeId || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (error) {
    logger.error('Error updating user', error as Error, {
      module: 'users',
      action: 'updateUser',
      userId
    });
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Get current user to prevent self-deletion
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    return { error: 'You cannot delete your own account' };
  }
  
  // Use admin client for deletion
  const adminClient = createAdminClient();
  
  // Delete user from auth (this will cascade delete profile due to foreign key)
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  
  if (error) {
    logger.error('Error deleting user', error as Error, {
      module: 'users',
      action: 'deleteUser',
      userId
    });
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function assignRole(userId: string, roleId: string) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      assigned_by: user?.id,
      assigned_at: new Date().toISOString(),
    });
  
  if (error) {
    logger.error('Error assigning role', error as Error, {
      module: 'users',
      action: 'assignRole',
      userId,
      metadata: { roleId }
    });
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function removeRole(userId: string, roleId: string) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  if (error) {
    logger.error('Error removing role', error as Error, {
      module: 'users',
      action: 'removeRole',
      userId,
      metadata: { roleId }
    });
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended') {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('profiles')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (error) {
    logger.error('Error updating user status', error as Error, {
      module: 'users',
      action: 'updateUserStatus',
      userId,
      metadata: { status }
    });
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Use admin client for password reset
  const adminClient = createAdminClient();
  
  // Update user password using admin privileges
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  
  if (error) {
    logger.error('Error resetting password', error as Error, {
      module: 'users',
      action: 'resetUserPassword',
      userId
    });
    return { error: error.message };
  }
  
  // Log the password reset action
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'password_reset',
    module: 'user_management',
    resource_type: 'user',
    resource_id: userId,
    created_at: new Date().toISOString(),
  });
  
  return { success: true };
}

export async function sendPasswordResetEmail(email: string) {
  // Verify current user is super_admin
  await requireSuperAdmin();
  
  // Use regular client for sending reset email (doesn't require admin)
  const supabase = await createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  });
  
  if (error) {
    logger.error('Error sending password reset email', error as Error, {
      module: 'users',
      action: 'sendPasswordResetEmail',
      metadata: { email }
    });
    return { error: error.message };
  }
  
  // Log the action
  const { data: { user } } = await supabase.auth.getUser();
  const adminClient = createAdminClient();
  
  await adminClient.from('activity_logs').insert({
    user_id: user?.id,
    action: 'password_reset_email_sent',
    module: 'user_management',
    resource_type: 'user',
    resource_id: email,
    created_at: new Date().toISOString(),
  });
  
  return { success: true };
}