import { 
  createUser, 
  updateUser, 
  deleteUser, 
  assignRole, 
  removeRole,
  updateUserStatus,
  resetUserPassword,
  sendPasswordResetEmail
} from '../actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { generateSecurePassword } from '@/lib/utils/password-generator';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn()
}));

jest.mock('@/lib/auth/helpers', () => ({
  requireSuperAdmin: jest.fn()
}));

jest.mock('@/lib/utils/password-generator', () => ({
  generateSecurePassword: jest.fn()
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('User Actions', () => {
  let mockSupabaseClient: any;
  let mockAdminClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'current-user-id', email: 'admin@test.com' } }
        }))
      }
    };

    mockAdminClient = {
      auth: {
        admin: {
          createUser: jest.fn(),
          deleteUser: jest.fn(),
          updateUserById: jest.fn()
        }
      },
      from: jest.fn(() => mockAdminClient),
      select: jest.fn(() => mockAdminClient),
      insert: jest.fn(() => mockAdminClient),
      update: jest.fn(() => mockAdminClient),
      delete: jest.fn(() => mockAdminClient),
      upsert: jest.fn(() => mockAdminClient),
      eq: jest.fn(() => mockAdminClient),
      single: jest.fn(() => mockAdminClient),
      resetPasswordForEmail: jest.fn()
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);
    (generateSecurePassword as jest.Mock).mockReturnValue('TempPass123!');
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const formData = new FormData();
      formData.append('email', 'newuser@test.com');
      formData.append('display_name', 'New User');
      formData.append('first_name', 'New');
      formData.append('last_name', 'User');
      formData.append('phone', '+1234567890');
      formData.append('employee_id', 'EMP001');
      formData.append('status', 'active');
      formData.append('role_id', 'role-123');

      // Mock successful auth user creation
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id', email: 'newuser@test.com' } },
        error: null
      });

      // Mock successful profile update
      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });

      // Mock successful role assignment
      mockAdminClient.insert.mockResolvedValue({
        data: { user_id: 'new-user-id', role_id: 'role-123' },
        error: null
      });

      const result = await createUser(formData);

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        password: 'TempPass123!',
        email_confirm: true
      });
      expect(mockAdminClient.upsert).toHaveBeenCalledWith({
        id: 'new-user-id',
        email: 'newuser@test.com',
        display_name: 'New User',
        first_name: 'New',
        last_name: 'User',
        phone: '+1234567890',
        employee_id: 'EMP001',
        status: 'active',
        updated_at: expect.any(String)
      }, { onConflict: 'id' });
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('should handle auth user creation error', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid@test.com');
      formData.append('first_name', 'Test');
      formData.append('last_name', 'User');

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      });

      const result = await createUser(formData);

      expect(result).toEqual({ error: 'Email already exists' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should handle profile update error and cleanup auth user', async () => {
      const formData = new FormData();
      formData.append('email', 'newuser@test.com');
      formData.append('first_name', 'New');
      formData.append('last_name', 'User');

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id', email: 'newuser@test.com' } },
        error: null
      });

      mockAdminClient.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Profile update failed' }
      });

      const result = await createUser(formData);

      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
      expect(result).toEqual({ error: 'Profile update failed' });
    });

    it('should assign role if provided', async () => {
      const formData = new FormData();
      formData.append('email', 'newuser@test.com');
      formData.append('first_name', 'New');
      formData.append('last_name', 'User');
      formData.append('role_id', 'role-123');

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null
      });

      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });

      mockAdminClient.insert.mockResolvedValue({
        data: { user_id: 'new-user-id', role_id: 'role-123' },
        error: null
      });

      const result = await createUser(formData);

      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        user_id: 'new-user-id',
        role_id: 'role-123',
        assigned_by: 'current-user-id',
        assigned_at: expect.any(String)
      });
      expect(result).toEqual({ success: true });
    });

    it('should not assign role if "no-role" is selected', async () => {
      const formData = new FormData();
      formData.append('email', 'newuser@test.com');
      formData.append('first_name', 'New');
      formData.append('last_name', 'User');
      formData.append('role_id', 'no-role');

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null
      });

      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });

      const result = await createUser(formData);

      expect(mockAdminClient.insert).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const formData = new FormData();
      formData.append('display_name', 'Updated User');
      formData.append('first_name', 'Updated');
      formData.append('last_name', 'User');
      formData.append('phone', '+1987654321');
      formData.append('employee_id', 'EMP002');
      formData.append('status', 'inactive');

      mockAdminClient.update.mockResolvedValue({
        data: { id: 'user-123' },
        error: null
      });

      const result = await updateUser('user-123', formData);

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.update).toHaveBeenCalledWith({
        display_name: 'Updated User',
        first_name: 'Updated',
        last_name: 'User',
        phone: '+1987654321',
        employee_id: 'EMP002',
        status: 'inactive',
        updated_at: expect.any(String)
      });
      expect(mockAdminClient.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('should handle update error', async () => {
      const formData = new FormData();
      formData.append('first_name', 'Updated');

      mockAdminClient.update.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      const result = await updateUser('user-123', formData);

      expect(result).toEqual({ error: 'Update failed' });
    });

    it('should handle null employee_id', async () => {
      const formData = new FormData();
      formData.append('first_name', 'Updated');
      formData.append('employee_id', '');

      mockAdminClient.update.mockResolvedValue({
        data: { id: 'user-123' },
        error: null
      });

      const result = await updateUser('user-123', formData);

      expect(mockAdminClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_id: null
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await deleteUser('user-123');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('should prevent self-deletion', async () => {
      const result = await deleteUser('current-user-id');

      expect(result).toEqual({ error: 'You cannot delete your own account' });
      expect(mockAdminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle deletion error', async () => {
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: { message: 'Deletion failed' }
      });

      const result = await deleteUser('user-123');

      expect(result).toEqual({ error: 'Deletion failed' });
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      mockAdminClient.insert.mockResolvedValue({
        data: { user_id: 'user-123', role_id: 'role-456' },
        error: null
      });

      const result = await assignRole('user-123', 'role-456');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        role_id: 'role-456',
        assigned_by: 'current-user-id',
        assigned_at: expect.any(String)
      });
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('should handle role assignment error', async () => {
      mockAdminClient.insert.mockResolvedValue({
        data: null,
        error: { message: 'Role assignment failed' }
      });

      const result = await assignRole('user-123', 'role-456');

      expect(result).toEqual({ error: 'Role assignment failed' });
    });
  });

  describe('removeRole', () => {
    it('should remove role successfully', async () => {
      mockAdminClient.delete.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await removeRole('user-123', 'role-456');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.delete).toHaveBeenCalled();
      expect(mockAdminClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockAdminClient.eq).toHaveBeenCalledWith('role_id', 'role-456');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('should handle role removal error', async () => {
      mockAdminClient.delete.mockResolvedValue({
        data: null,
        error: { message: 'Role removal failed' }
      });

      const result = await removeRole('user-123', 'role-456');

      expect(result).toEqual({ error: 'Role removal failed' });
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      mockAdminClient.update.mockResolvedValue({
        data: { id: 'user-123' },
        error: null
      });

      const result = await updateUserStatus('user-123', 'suspended');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.update).toHaveBeenCalledWith({
        status: 'suspended',
        updated_at: expect.any(String)
      });
      expect(mockAdminClient.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('should handle status update error', async () => {
      mockAdminClient.update.mockResolvedValue({
        data: null,
        error: { message: 'Status update failed' }
      });

      const result = await updateUserStatus('user-123', 'active');

      expect(result).toEqual({ error: 'Status update failed' });
    });
  });

  describe('resetUserPassword', () => {
    it('should reset password successfully', async () => {
      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockAdminClient.insert.mockResolvedValue({
        data: { id: 'log-123' },
        error: null
      });

      const result = await resetUserPassword('user-123', 'NewPassword123!');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
        password: 'NewPassword123!'
      });
      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        user_id: 'current-user-id',
        action: 'password_reset',
        module: 'user_management',
        resource_type: 'user',
        resource_id: 'user-123',
        created_at: expect.any(String)
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle password reset error', async () => {
      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: null,
        error: { message: 'Password reset failed' }
      });

      const result = await resetUserPassword('user-123', 'NewPassword123!');

      expect(result).toEqual({ error: 'Password reset failed' });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockSupabaseClient.auth = {
        ...mockSupabaseClient.auth,
        resetPasswordForEmail: jest.fn().mockResolvedValue({
          error: null
        })
      };

      mockAdminClient.insert.mockResolvedValue({
        data: { id: 'log-123' },
        error: null
      });

      const result = await sendPasswordResetEmail('user@test.com');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@test.com',
        { redirectTo: 'http://localhost:3000/auth/callback' }
      );
      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        user_id: 'current-user-id',
        action: 'password_reset_email_sent',
        module: 'user_management',
        resource_type: 'user',
        resource_id: 'user@test.com',
        created_at: expect.any(String)
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle email sending error', async () => {
      mockSupabaseClient.auth = {
        ...mockSupabaseClient.auth,
        resetPasswordForEmail: jest.fn().mockResolvedValue({
          error: { message: 'Email sending failed' }
        })
      };

      const result = await sendPasswordResetEmail('user@test.com');

      expect(result).toEqual({ error: 'Email sending failed' });
    });
  });

  describe('Authorization', () => {
    it('should require super admin for all operations', async () => {
      const formData = new FormData();
      formData.append('email', 'test@test.com');

      await createUser(formData);
      await updateUser('user-123', formData);
      await deleteUser('user-123');
      await assignRole('user-123', 'role-456');
      await removeRole('user-123', 'role-456');
      await updateUserStatus('user-123', 'active');
      await resetUserPassword('user-123', 'password');
      await sendPasswordResetEmail('test@test.com');

      expect(requireSuperAdmin).toHaveBeenCalledTimes(8);
    });
  });
});