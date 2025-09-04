'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createUser(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get('email') as string;
  const displayName = formData.get('display_name') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const employeeId = formData.get('employee_id') as string;
  const status = formData.get('status') as string || 'active';
  
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  
  if (authError) {
    console.error('Error creating auth user:', authError);
    return { error: authError.message };
  }
  
  // Create profile for the user
  const { error: profileError } = await supabase
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
    await supabase.auth.admin.deleteUser(authData.user!.id);
    return { error: profileError.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function updateUser(userId: string, formData: FormData) {
  const supabase = await createClient();
  
  const displayName = formData.get('display_name') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const employeeId = formData.get('employee_id') as string;
  const status = formData.get('status') as string;
  
  const { error } = await supabase
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
  const supabase = await createClient();
  
  // Check if user is trying to delete themselves
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    return { error: 'You cannot delete your own account' };
  }
  
  // Delete user from auth (this will cascade delete profile due to foreign key)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    console.error('Error deleting user:', error);
    return { error: error.message };
  }
  
  revalidatePath('/users');
  return { success: true };
}

export async function assignRole(userId: string, roleId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
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
  const supabase = await createClient();
  
  const { error } = await supabase
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
  const supabase = await createClient();
  
  const { error } = await supabase
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