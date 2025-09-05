'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logging';

export async function updateProfile(userId: string, formData: FormData) {
  const supabase = await createClient();
  
  // Verify the user is updating their own profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Unauthorized' };
  }
  
  const displayName = formData.get('display_name') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  
  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (profileError) {
    logger.error('Error updating profile', profileError as Error, {
      module: 'profile',
      action: 'updateProfile',
      userId
    });
    return { error: profileError.message };
  }
  
  // Update email in auth if changed
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: email
    });
    
    if (emailError) {
      logger.error('Error updating email', emailError as Error, {
        module: 'profile',
        action: 'updateProfile',
        userId,
        metadata: { email }
      });
      return { error: `Email update failed: ${emailError.message}` };
    }
  }
  
  revalidatePath('/profile');
  return { success: true };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  
  // First, verify the current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  
  if (signInError) {
    return { error: 'Current password is incorrect' };
  }
  
  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (updateError) {
    logger.error('Error updating password', updateError as Error, {
      module: 'profile',
      action: 'changePassword',
      userId: user.id
    });
    return { error: updateError.message };
  }
  
  // Log the password change
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'password_changed',
    module: 'user_profile',
    resource_type: 'user',
    resource_id: user.id,
    created_at: new Date().toISOString(),
  });
  
  return { success: true };
}