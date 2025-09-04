'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, createSecureAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  const password = formData.get('password') as string || Math.random().toString(36).slice(-8) + 'Aa1!';
  
  // Create user in Supabase Auth with admin privileges
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (authError) {
    console.error('Error creating auth user:', authError);
    return { error: authError.message };
  }
  
  // Create profile for the user using admin client (bypasses RLS)
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: authData.user!.id,
      email,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      phone,
      employee_id: employeeId || null,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Try to clean up auth user if profile creation fails
    await adminClient.auth.admin.deleteUser(authData.user!.id);
    return { error: profileError.message };
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
    console.error('Error updating user:', error);
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
    console.error('Error deleting user:', error);
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
    console.error('Error assigning role:', error);
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
    console.error('Error removing role:', error);
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
    console.error('Error updating user status:', error);
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}