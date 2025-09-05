import { 
  createRole, 
  updateRole, 
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getAvailablePermissions,
  getRoleUsers,
  duplicateRole
} from '../actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
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

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('Role Management Actions', () => {
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
      from: jest.fn(() => mockAdminClient),
      select: jest.fn(() => mockAdminClient),
      insert: jest.fn(() => mockAdminClient),
      update: jest.fn(() => mockAdminClient),
      delete: jest.fn(() => mockAdminClient),
      eq: jest.fn(() => mockAdminClient),
      in: jest.fn(() => mockAdminClient),
      like: jest.fn(() => mockAdminClient),
      order: jest.fn(() => mockAdminClient),
      single: jest.fn(() => mockAdminClient),
      maybeSingle: jest.fn(() => mockAdminClient)
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const formData = new FormData();
      formData.append('name', 'test_role');
      formData.append('display_name', 'Test Role');
      formData.append('description', 'A test role');
      formData.append('module_id', 'module-123');
      formData.append('priority', '10');

      // Mock no existing role
      mockAdminClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful creation
      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', name: 'test_role' },
        error: null
      });

      mockAdminClient.insert.mockImplementation(() => {
        // For role creation
        if (mockAdminClient.from.mock.calls[mockAdminClient.from.mock.calls.length - 1][0] === 'roles') {
          return mockAdminClient;
        }
        // For activity log
        return {
          insert: jest.fn().mockResolvedValue({ data: { id: 'log-123' }, error: null })
        };
      });

      const result = await createRole(formData);

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.insert).toHaveBeenCalledWith({
        name: 'test_role',
        display_name: 'Test Role',
        description: 'A test role',
        module_id: 'module-123',
        priority: 10,
        is_system: false,
        created_at: expect.any(String)
      });
      expect(result).toEqual({ success: true, role: { id: 'role-123', name: 'test_role' } });
      expect(revalidatePath).toHaveBeenCalledWith('/users/roles');
    });

    it('should handle global module (null module_id)', async () => {
      const formData = new FormData();
      formData.append('name', 'global_role');
      formData.append('display_name', 'Global Role');
      formData.append('module_id', 'global');

      mockAdminClient.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockAdminClient.single.mockResolvedValue({ data: { id: 'role-123' }, error: null });

      await createRole(formData);

      expect(mockAdminClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: null
        })
      );
    });

    it('should prevent duplicate role names within same module', async () => {
      const formData = new FormData();
      formData.append('name', 'existing_role');
      formData.append('display_name', 'Existing Role');
      formData.append('module_id', 'module-123');

      // Mock existing role
      mockAdminClient.maybeSingle.mockResolvedValue({
        data: { id: 'existing-role-id' },
        error: null
      });

      const result = await createRole(formData);

      expect(result).toEqual({ error: 'Role with this name already exists in this scope' });
      expect(mockAdminClient.insert).not.toHaveBeenCalled();
    });

    it('should handle role creation error', async () => {
      const formData = new FormData();
      formData.append('name', 'test_role');
      formData.append('display_name', 'Test Role');

      mockAdminClient.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockAdminClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Creation failed' }
      });

      const result = await createRole(formData);

      expect(result).toEqual({ error: 'Creation failed' });
    });

    it('should default priority to 0', async () => {
      const formData = new FormData();
      formData.append('name', 'test_role');
      formData.append('display_name', 'Test Role');

      mockAdminClient.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockAdminClient.single.mockResolvedValue({ data: { id: 'role-123' }, error: null });

      await createRole(formData);

      expect(mockAdminClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 0
        })
      );
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const formData = new FormData();
      formData.append('display_name', 'Updated Role');
      formData.append('description', 'Updated description');
      formData.append('priority', '15');

      // Mock existing role
      mockAdminClient.single.mockResolvedValue({
        data: { 
          id: 'role-123', 
          is_system: false,
          display_name: 'Old Name',
          description: 'Old description',
          priority: 10
        },
        error: null
      });

      // Mock successful update
      mockAdminClient.update.mockResolvedValue({
        data: { id: 'role-123' },
        error: null
      });

      const result = await updateRole('role-123', formData);

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.update).toHaveBeenCalledWith({
        display_name: 'Updated Role',
        description: 'Updated description',
        priority: 15
      });
      expect(mockAdminClient.eq).toHaveBeenCalledWith('id', 'role-123');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users/roles');
    });

    it('should prevent updating system roles', async () => {
      const formData = new FormData();
      formData.append('display_name', 'Updated Role');

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', is_system: true },
        error: null
      });

      const result = await updateRole('role-123', formData);

      expect(result).toEqual({ error: 'Cannot modify system roles' });
      expect(mockAdminClient.update).not.toHaveBeenCalled();
    });

    it('should handle non-existent role', async () => {
      const formData = new FormData();
      formData.append('display_name', 'Updated Role');

      mockAdminClient.single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await updateRole('non-existent', formData);

      expect(result).toEqual({ error: 'Role not found' });
    });

    it('should handle update error', async () => {
      const formData = new FormData();
      formData.append('display_name', 'Updated Role');

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', is_system: false },
        error: null
      });

      mockAdminClient.update.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      const result = await updateRole('role-123', formData);

      expect(result).toEqual({ error: 'Update failed' });
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      // Mock existing role
      mockAdminClient.select.mockImplementation(() => {
        const calls = mockAdminClient.from.mock.calls;
        const lastCall = calls[calls.length - 1];
        
        if (lastCall[0] === 'roles') {
          return {
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'role-123', is_system: false, name: 'test_role' },
                error: null
              })
            }))
          };
        } else if (lastCall[0] === 'user_roles') {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [],
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

      const result = await deleteRole('role-123');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.delete).toHaveBeenCalled();
      expect(mockAdminClient.eq).toHaveBeenCalledWith('id', 'role-123');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users/roles');
    });

    it('should prevent deleting system roles', async () => {
      mockAdminClient.select.mockReturnValue({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'role-123', is_system: true },
            error: null
          })
        }))
      });

      const result = await deleteRole('role-123');

      expect(result).toEqual({ error: 'Cannot delete system roles' });
      expect(mockAdminClient.delete).not.toHaveBeenCalled();
    });

    it('should prevent deleting roles with assigned users', async () => {
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

      expect(result).toEqual({ 
        error: 'Cannot delete role. 2 user(s) have this role assigned.',
        userCount: 2 
      });
      expect(mockAdminClient.delete).not.toHaveBeenCalled();
    });

    it('should handle non-existent role', async () => {
      mockAdminClient.select.mockReturnValue({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      });

      const result = await deleteRole('non-existent');

      expect(result).toEqual({ error: 'Role not found' });
    });
  });

  describe('getRolePermissions', () => {
    it('should fetch role permissions successfully', async () => {
      const mockPermissions = [
        {
          permission: {
            id: 'perm-1',
            module_id: 'module-1',
            resource: 'users',
            action: 'create',
            description: 'Create users',
            module: { name: 'user_management', display_name: 'User Management' }
          }
        }
      ];

      mockAdminClient.select.mockResolvedValue({
        data: mockPermissions,
        error: null
      });

      const result = await getRolePermissions('role-123');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.eq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result).toEqual({ 
        permissions: [mockPermissions[0].permission] 
      });
    });

    it('should handle permissions fetch error', async () => {
      mockAdminClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Fetch failed' }
      });

      const result = await getRolePermissions('role-123');

      expect(result).toEqual({ error: 'Fetch failed' });
    });

    it('should handle empty permissions', async () => {
      mockAdminClient.select.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await getRolePermissions('role-123');

      expect(result).toEqual({ permissions: [] });
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions successfully', async () => {
      const permissionIds = ['perm-1', 'perm-2', 'perm-3'];

      // Mock existing role
      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', name: 'test_role' },
        error: null
      });

      // Mock current permissions
      mockAdminClient.select.mockResolvedValue({
        data: [
          { permission_id: 'perm-1' },
          { permission_id: 'perm-4' } // This will be removed
        ],
        error: null
      });

      // Mock successful deletion and insertion
      mockAdminClient.delete.mockResolvedValue({ error: null });
      mockAdminClient.insert.mockResolvedValue({ error: null });

      const result = await updateRolePermissions('role-123', permissionIds);

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/users/roles');
    });

    it('should prevent removing all permissions from super_admin', async () => {
      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', name: 'super_admin' },
        error: null
      });

      const result = await updateRolePermissions('role-123', []);

      expect(result).toEqual({ error: 'Cannot remove all permissions from super_admin role' });
    });

    it('should handle role not found', async () => {
      mockAdminClient.single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await updateRolePermissions('non-existent', ['perm-1']);

      expect(result).toEqual({ error: 'Role not found' });
    });

    it('should handle permission deletion error', async () => {
      const permissionIds = ['perm-1'];

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', name: 'test_role' },
        error: null
      });

      mockAdminClient.select.mockResolvedValue({
        data: [{ permission_id: 'perm-2' }],
        error: null
      });

      mockAdminClient.delete.mockResolvedValue({
        error: { message: 'Delete failed' }
      });

      const result = await updateRolePermissions('role-123', permissionIds);

      expect(result).toEqual({ error: 'Delete failed' });
    });

    it('should handle permission insertion error', async () => {
      const permissionIds = ['perm-1', 'perm-2'];

      mockAdminClient.single.mockResolvedValue({
        data: { id: 'role-123', name: 'test_role' },
        error: null
      });

      mockAdminClient.select.mockResolvedValue({
        data: [{ permission_id: 'perm-1' }],
        error: null
      });

      mockAdminClient.delete.mockResolvedValue({ error: null });
      mockAdminClient.insert.mockResolvedValue({
        error: { message: 'Insert failed' }
      });

      const result = await updateRolePermissions('role-123', permissionIds);

      expect(result).toEqual({ error: 'Insert failed' });
    });
  });

  describe('getAvailablePermissions', () => {
    it('should fetch and group permissions by module', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          module_id: 'module-1',
          resource: 'users',
          action: 'create',
          module: { display_name: 'User Management' }
        },
        {
          id: 'perm-2',
          module_id: 'module-1',
          resource: 'users',
          action: 'read',
          module: { display_name: 'User Management' }
        },
        {
          id: 'perm-3',
          module_id: 'module-2',
          resource: 'products',
          action: 'create',
          module: { display_name: 'Inventory' }
        }
      ];

      mockAdminClient.order.mockResolvedValue({
        data: mockPermissions,
        error: null
      });

      const result = await getAvailablePermissions();

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(result.permissions).toHaveProperty('User Management');
      expect(result.permissions).toHaveProperty('Inventory');
      expect(result.permissions['User Management']).toHaveLength(2);
      expect(result.permissions['Inventory']).toHaveLength(1);
    });

    it('should handle permissions fetch error', async () => {
      mockAdminClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Fetch failed' }
      });

      const result = await getAvailablePermissions();

      expect(result).toEqual({ error: 'Fetch failed' });
    });

    it('should handle module as array', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          module_id: 'module-1',
          resource: 'users',
          action: 'create',
          module: [{ display_name: 'User Management' }] // Array format
        }
      ];

      mockAdminClient.order.mockResolvedValue({
        data: mockPermissions,
        error: null
      });

      const result = await getAvailablePermissions();

      expect(result.permissions).toHaveProperty('User Management');
    });
  });

  describe('getRoleUsers', () => {
    it('should fetch users assigned to role', async () => {
      const mockUserRoles = [
        {
          user: {
            id: 'user-1',
            email: 'user1@test.com',
            display_name: 'User One',
            first_name: 'User',
            last_name: 'One'
          },
          assigned_at: '2024-01-01T00:00:00Z',
          expires_at: null
        }
      ];

      mockAdminClient.select.mockResolvedValue({
        data: mockUserRoles,
        error: null
      });

      const result = await getRoleUsers('role-123');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(mockAdminClient.eq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toMatchObject({
        id: 'user-1',
        email: 'user1@test.com',
        assigned_at: '2024-01-01T00:00:00Z'
      });
    });

    it('should handle fetch error', async () => {
      mockAdminClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Fetch failed' }
      });

      const result = await getRoleUsers('role-123');

      expect(result).toEqual({ error: 'Fetch failed' });
    });
  });

  describe('duplicateRole', () => {
    it('should duplicate role successfully', async () => {
      const originalRole = {
        id: 'original-role',
        name: 'original_role',
        display_name: 'Original Role',
        description: 'Original description',
        module_id: 'module-123',
        priority: 10,
        is_system: false
      };

      // Mock original role fetch
      mockAdminClient.select.mockImplementation(() => {
        const calls = mockAdminClient.from.mock.calls;
        const lastCall = calls[calls.length - 1];
        
        if (lastCall[0] === 'roles') {
          return {
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: originalRole,
                error: null
              }),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // No existing role with new name
                error: null
              })
            }))
          };
        } else if (lastCall[0] === 'role_permissions') {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { permission_id: 'perm-1' },
                { permission_id: 'perm-2' }
              ],
              error: null
            })
          };
        }
        return mockAdminClient;
      });

      // Mock new role creation
      mockAdminClient.single.mockResolvedValue({
        data: { id: 'new-role', name: 'duplicated_role' },
        error: null
      });

      // Mock permission copying
      mockAdminClient.insert.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await duplicateRole('original-role', 'duplicated_role');

      expect(requireSuperAdmin).toHaveBeenCalled();
      expect(result).toEqual({ success: true, role: { id: 'new-role', name: 'duplicated_role' } });
      expect(revalidatePath).toHaveBeenCalledWith('/users/roles');
    });

    it('should prevent duplicate names', async () => {
      mockAdminClient.select.mockReturnValue({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'original' },
            error: null
          }),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'existing' }, // Name already exists
            error: null
          })
        }))
      });

      const result = await duplicateRole('original-role', 'existing_name');

      expect(result).toEqual({ error: 'Role with this name already exists' });
    });

    it('should handle original role not found', async () => {
      mockAdminClient.select.mockReturnValue({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      });

      const result = await duplicateRole('non-existent', 'new_name');

      expect(result).toEqual({ error: 'Role not found' });
    });
  });

  describe('Authorization', () => {
    it('should require super admin for all operations', async () => {
      const formData = new FormData();
      formData.append('name', 'test');

      await createRole(formData);
      await updateRole('role-123', formData);
      await deleteRole('role-123');
      await getRolePermissions('role-123');
      await updateRolePermissions('role-123', ['perm-1']);
      await getAvailablePermissions();
      await getRoleUsers('role-123');
      await duplicateRole('role-123', 'new_name');

      expect(requireSuperAdmin).toHaveBeenCalledTimes(8);
    });
  });
});