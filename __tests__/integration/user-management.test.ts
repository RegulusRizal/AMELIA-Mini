/**
 * Integration Tests for User Management System
 * 
 * These tests verify end-to-end workflows for user management operations,
 * simulating real-world scenarios across multiple components and actions.
 */

import { 
  createUser, 
  updateUser, 
  deleteUser, 
  assignRole, 
  removeRole
} from '@/app/users/actions';
import { 
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
} from '@/app/users/roles/actions';
import {
  getUsers,
  getUserById,
  getRoles,
  getRoleById,
  checkPermission
} from '@/lib/modules/user-management/queries';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import {
  createMockUser,
  createMockRole,
  createMockPermission,
  createFormData,
  expectSuccessResult,
  expectErrorResult
} from '../utils/test-utils';

// Mock all dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/auth/helpers');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

describe('User Management Integration Tests', () => {
  let mockSupabaseClient: any;
  let mockAdminClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup comprehensive mock clients
    mockSupabaseClient = {
      from: jest.fn(() => mockSupabaseClient),
      select: jest.fn(() => mockSupabaseClient),
      insert: jest.fn(() => mockSupabaseClient),
      update: jest.fn(() => mockSupabaseClient),
      delete: jest.fn(() => mockSupabaseClient),
      eq: jest.fn(() => mockSupabaseClient),
      or: jest.fn(() => mockSupabaseClient),
      order: jest.fn(() => mockSupabaseClient),
      range: jest.fn(() => mockSupabaseClient),
      single: jest.fn(() => mockSupabaseClient),
      rpc: jest.fn(),
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'admin-user-id', email: 'admin@test.com' } }
        }))
      }
    };

    mockAdminClient = {
      ...mockSupabaseClient,
      auth: {
        admin: {
          createUser: jest.fn(),
          updateUserById: jest.fn(),
          deleteUser: jest.fn()
        }
      }
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);
    (requireSuperAdmin as jest.Mock).mockResolvedValue(true);
  });

  describe('Complete User Lifecycle', () => {
    it('should create, update, assign role, and delete user successfully', async () => {
      // Step 1: Create user
      const userData = createFormData({
        email: 'newuser@test.com',
        first_name: 'New',
        last_name: 'User',
        display_name: 'New User',
        status: 'active',
        role_id: 'no-role'
      });

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id', email: 'newuser@test.com' } },
        error: null
      });

      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });

      const createResult = await createUser(userData);
      expectSuccessResult(createResult);

      // Step 2: Update user
      const updateData = createFormData({
        first_name: 'Updated',
        last_name: 'User',
        display_name: 'Updated User',
        status: 'active'
      });

      mockAdminClient.update.mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });

      const updateResult = await updateUser('new-user-id', updateData);
      expectSuccessResult(updateResult);

      // Step 3: Assign role
      mockAdminClient.insert.mockResolvedValue({
        data: { user_id: 'new-user-id', role_id: 'role-123' },
        error: null
      });

      const assignResult = await assignRole('new-user-id', 'role-123');
      expectSuccessResult(assignResult);

      // Step 4: Remove role
      mockAdminClient.delete.mockResolvedValue({
        data: [],
        error: null
      });

      const removeResult = await removeRole('new-user-id', 'role-123');
      expectSuccessResult(removeResult);

      // Step 5: Delete user
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const deleteResult = await deleteUser('new-user-id');
      expectSuccessResult(deleteResult);

      // Verify all operations called required functions
      expect(requireSuperAdmin).toHaveBeenCalledTimes(5);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalled();
      expect(mockAdminClient.update).toHaveBeenCalled();
      expect(mockAdminClient.insert).toHaveBeenCalled();
      expect(mockAdminClient.delete).toHaveBeenCalled();
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalled();
    });

    it('should handle user creation with immediate role assignment', async () => {
      const userData = createFormData({
        email: 'roleuser@test.com',
        first_name: 'Role',
        last_name: 'User',
        status: 'active',
        role_id: 'role-123'
      });

      // Mock successful user creation
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'role-user-id' } },
        error: null
      });

      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'role-user-id' },
        error: null
      });

      // Mock successful role assignment
      mockAdminClient.insert.mockResolvedValue({
        data: { user_id: 'role-user-id', role_id: 'role-123' },
        error: null
      });

      const result = await createUser(userData);
      expectSuccessResult(result);

      // Verify role was assigned during creation
      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        user_id: 'role-user-id',
        role_id: 'role-123',
        assigned_by: 'admin-user-id',
        assigned_at: expect.any(String)
      });
    });
  });

  describe('Complete Role Lifecycle', () => {
    it('should create, update permissions, and delete role successfully', async () => {
      // Step 1: Create role
      const roleData = createFormData({
        name: 'test_role',
        display_name: 'Test Role',
        description: 'Test role description',
        module_id: 'global',
        priority: '10'
      });

      mockAdminClient.maybeSingle.mockResolvedValue({
        data: null, // No existing role
        error: null
      });

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'new-role-id', name: 'test_role' },
        error: null
      });

      mockAdminClient.insert.mockResolvedValue({
        data: { id: 'log-123' },
        error: null
      });

      const createResult = await createRole(roleData);
      expectSuccessResult(createResult);

      // Step 2: Update role permissions
      const permissionIds = ['perm-1', 'perm-2', 'perm-3'];

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'new-role-id', name: 'test_role' },
        error: null
      });

      mockAdminClient.select.mockResolvedValue({
        data: [{ permission_id: 'perm-4' }], // Existing permission to remove
        error: null
      });

      mockAdminClient.delete.mockResolvedValue({ error: null });
      mockAdminClient.insert.mockResolvedValue({ error: null });

      const permResult = await updateRolePermissions('new-role-id', permissionIds);
      expectSuccessResult(permResult);

      // Step 3: Delete role
      mockAdminClient.select.mockImplementation(() => {
        const calls = mockAdminClient.from.mock.calls;
        const lastCall = calls[calls.length - 1];
        
        if (lastCall[0] === 'roles') {
          return {
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-role-id', is_system: false },
                error: null
              })
            }))
          };
        } else if (lastCall[0] === 'user_roles') {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [], // No users assigned
              error: null
            })
          };
        }
        return mockAdminClient;
      });

      mockAdminClient.delete.mockResolvedValue({
        data: [],
        error: null
      });

      const deleteResult = await deleteRole('new-role-id');
      expectSuccessResult(deleteResult);

      expect(requireSuperAdmin).toHaveBeenCalledTimes(3);
    });

    it('should prevent role deletion when users are assigned', async () => {
      mockAdminClient.select.mockImplementation(() => {
        const calls = mockAdminClient.from.mock.calls;
        const lastCall = calls[calls.length - 1];
        
        if (lastCall[0] === 'roles') {
          return {
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'role-123', is_system: false },
                error: null
              })
            }))
          };
        } else if (lastCall[0] === 'user_roles') {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
              error: null
            })
          };
        }
        return mockAdminClient;
      });

      const result = await deleteRole('role-123');
      expectErrorResult(result, 'Cannot delete role. 2 user(s) have this role assigned.');
      expect(result.userCount).toBe(2);
    });
  });

  describe('User and Role Queries Integration', () => {
    it('should fetch users with role filtering', async () => {
      const mockUsers = [
        createMockUser({ id: 'user-1' }),
        createMockUser({ id: 'user-2', status: 'inactive' })
      ];

      mockSupabaseClient.range.mockResolvedValue({
        data: mockUsers,
        count: 2,
        error: null
      });

      const result = await getUsers({
        role_id: 'admin-role',
        status: 'active',
        search: 'test',
        page: 1,
        limit: 10
      });

      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        '*, user_roles!inner(role_id)',
        { count: 'exact' }
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_roles.role_id', 'admin-role');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'email.ilike.%test%,first_name.ilike.%test%,last_name.ilike.%test%,employee_id.ilike.%test%'
      );
    });

    it('should fetch roles with module filtering', async () => {
      const mockRoles = [
        createMockRole({ id: 'role-1', module_id: 'user_management' }),
        createMockRole({ id: 'role-2', module_id: 'user_management', is_system: true })
      ];

      mockSupabaseClient.range.mockResolvedValue({
        data: mockRoles,
        count: 2,
        error: null
      });

      const result = await getRoles({
        module_id: 'user_management',
        is_system: false,
        search: 'admin',
        page: 1,
        limit: 20
      });

      expect(result.data).toEqual(mockRoles);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('module_id', 'user_management');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_system', false);
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'name.ilike.%admin%,display_name.ilike.%admin%,description.ilike.%admin%'
      );
    });

    it('should fetch user with complete role and permission data', async () => {
      const mockUserWithRoles = {
        ...createMockUser(),
        user_type: { id: 'type-1', name: 'employee' },
        user_roles: [
          {
            role: {
              id: 'role-1',
              name: 'admin',
              role_permissions: [
                { permission: { id: 'perm-1', resource: 'users', action: 'create' } }
              ]
            }
          }
        ]
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockUserWithRoles,
        error: null
      });

      const result = await getUserById('user-123');

      expect(result).toEqual(mockUserWithRoles);
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('user_roles')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('role_permissions')
      );
    });
  });

  describe('Permission System Integration', () => {
    it('should check user permissions through role assignments', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const hasPermission = await checkPermission(
        'user_management',
        'users',
        'create',
        'user-123'
      );

      expect(hasPermission).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('has_permission', {
        p_module: 'user_management',
        p_resource: 'users',
        p_action: 'create',
        p_user_id: 'user-123'
      });
    });

    it('should handle complex permission checks across modules', async () => {
      // Simulate checking multiple permissions
      const permissions = [
        { module: 'user_management', resource: 'users', action: 'create' },
        { module: 'user_management', resource: 'roles', action: 'read' },
        { module: 'inventory', resource: 'products', action: 'update' }
      ];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: true, error: null })  // users:create = true
        .mockResolvedValueOnce({ data: true, error: null })  // roles:read = true
        .mockResolvedValueOnce({ data: false, error: null }); // products:update = false

      const results = await Promise.all(
        permissions.map(p => checkPermission(p.module, p.resource, p.action, 'user-123'))
      );

      expect(results).toEqual([true, true, false]);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        count: null,
        error: { message: 'Database connection failed' }
      });

      const result = await getUsers();

      // Should return empty result instead of throwing
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0
      });
    });

    it('should rollback user creation if profile creation fails', async () => {
      const userData = createFormData({
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User'
      });

      // Auth user creation succeeds
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null
      });

      // Profile creation fails
      mockAdminClient.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Profile creation failed' }
      });

      const result = await createUser(userData);

      expectErrorResult(result, 'Profile creation failed');
      
      // Should attempt to clean up auth user
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
    });

    it('should handle concurrent role assignments gracefully', async () => {
      // Simulate race condition where role is assigned twice
      mockAdminClient.insert
        .mockResolvedValueOnce({
          data: { user_id: 'user-123', role_id: 'role-456' },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Role already assigned' }
        });

      const result1 = await assignRole('user-123', 'role-456');
      const result2 = await assignRole('user-123', 'role-456');

      expectSuccessResult(result1);
      expectErrorResult(result2, 'Role already assigned');
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple user operations in sequence', async () => {
      const users = [
        { email: 'user1@test.com', first_name: 'User', last_name: 'One' },
        { email: 'user2@test.com', first_name: 'User', last_name: 'Two' },
        { email: 'user3@test.com', first_name: 'User', last_name: 'Three' }
      ];

      // Mock successful creation for all users
      mockAdminClient.auth.admin.createUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-1' } },
          error: null
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-2' } },
          error: null
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-3' } },
          error: null
        });

      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'created' },
        error: null
      });

      const results = await Promise.all(
        users.map(user => createUser(createFormData(user)))
      );

      // All operations should succeed
      results.forEach(result => expectSuccessResult(result));
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledTimes(3);
    });

    it('should handle batch role permission updates', async () => {
      const roleUpdates = [
        { roleId: 'role-1', permissions: ['perm-1', 'perm-2'] },
        { roleId: 'role-2', permissions: ['perm-2', 'perm-3'] },
        { roleId: 'role-3', permissions: ['perm-1', 'perm-3'] }
      ];

      // Mock role existence checks
      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role', name: 'test_role' },
        error: null
      });

      // Mock current permissions (empty)
      mockAdminClient.select.mockResolvedValue({
        data: [],
        error: null
      });

      // Mock successful permission insertions
      mockAdminClient.insert.mockResolvedValue({ error: null });

      const results = await Promise.all(
        roleUpdates.map(update => 
          updateRolePermissions(update.roleId, update.permissions)
        )
      );

      // All updates should succeed
      results.forEach(result => expectSuccessResult(result));
      expect(mockAdminClient.single).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Consistency Checks', () => {
    it('should maintain referential integrity during operations', async () => {
      // Test that role assignment requires both user and role to exist
      const userData = createFormData({
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role_id: 'role-123'
      });

      // User creation succeeds
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockAdminClient.upsert.mockResolvedValue({
        data: { id: 'user-123' },
        error: null
      });

      // Role assignment fails (role doesn't exist)
      mockAdminClient.insert.mockResolvedValue({
        data: null,
        error: { message: 'Role not found' }
      });

      const result = await createUser(userData);

      // User creation should still succeed even if role assignment fails
      expectSuccessResult(result);
      
      // But role assignment should have been attempted
      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        role_id: 'role-123',
        assigned_by: 'admin-user-id',
        assigned_at: expect.any(String)
      });
    });

    it('should prevent system role modifications', async () => {
      const updateData = createFormData({
        display_name: 'Modified System Role'
      });

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'system-role', is_system: true },
        error: null
      });

      const result = await updateRole('system-role', updateData);

      expectErrorResult(result, 'Cannot modify system roles');
      expect(mockAdminClient.update).not.toHaveBeenCalled();
    });

    it('should prevent super admin permission removal', async () => {
      mockAdminClient.single.mockResolvedValue({
        data: { id: 'super-admin-role', name: 'super_admin' },
        error: null
      });

      const result = await updateRolePermissions('super-admin-role', []);

      expectErrorResult(result, 'Cannot remove all permissions from super_admin role');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle pagination correctly for large datasets', async () => {
      // Simulate large dataset
      const totalUsers = 1000;
      const pageSize = 50;
      const page = 10;

      mockSupabaseClient.range.mockResolvedValue({
        data: Array(pageSize).fill(null).map((_, i) => 
          createMockUser({ id: `user-${(page - 1) * pageSize + i}` })
        ),
        count: totalUsers,
        error: null
      });

      const result = await getUsers({ page, limit: pageSize });

      expect(result.total).toBe(totalUsers);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(pageSize);
      expect(result.total_pages).toBe(20);
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(450, 499); // Correct offset
    });

    it('should optimize queries with proper indexing hints', async () => {
      await getUsers({
        search: 'john',
        status: 'active',
        role_id: 'admin-role'
      });

      // Verify efficient query construction
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        '*, user_roles!inner(role_id)',
        { count: 'exact' }
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_roles.role_id', 'admin-role');
    });
  });
});