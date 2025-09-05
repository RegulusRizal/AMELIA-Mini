import {
  getUsers,
  getUserById,
  getCurrentUser,
  getRoles,
  getRoleById,
  getPermissions,
  getUserPermissions,
  checkPermission,
  getModules,
  canAccessModule,
  getUserTypes,
  getActivityLogs,
  getUserRoles
} from '../queries';
import { createClient } from '@/lib/supabase/server';
import type { UserFilterParams, RoleFilterParams } from '../types';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

describe('User Management Queries', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(() => mockSupabaseClient),
      select: jest.fn(() => mockSupabaseClient),
      eq: jest.fn(() => mockSupabaseClient),
      or: jest.fn(() => mockSupabaseClient),
      not: jest.fn(() => mockSupabaseClient),
      is: jest.fn(() => mockSupabaseClient),
      like: jest.fn(() => mockSupabaseClient),
      order: jest.fn(() => mockSupabaseClient),
      range: jest.fn(() => mockSupabaseClient),
      single: jest.fn(() => mockSupabaseClient),
      limit: jest.fn(() => mockSupabaseClient),
      rpc: jest.fn(),
      auth: {
        getUser: jest.fn()
      }
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('getUsers', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@test.com',
        first_name: 'User',
        last_name: 'One',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'user-2',
        email: 'user2@test.com',
        first_name: 'User',
        last_name: 'Two',
        status: 'inactive',
        created_at: '2024-01-02T00:00:00Z'
      }
    ];

    it('should fetch users with default parameters', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: mockUsers,
        count: 2,
        error: null
      });

      const result = await getUsers();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 19); // page 1, limit 20
      expect(result).toEqual({
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1
      });
    });

    it('should apply search filter', async () => {
      const params: UserFilterParams = { search: 'john' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'email.ilike.%john%,first_name.ilike.%john%,last_name.ilike.%john%,employee_id.ilike.%john%'
      );
    });

    it('should apply status filter', async () => {
      const params: UserFilterParams = { status: 'active' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should apply user_type_id filter', async () => {
      const params: UserFilterParams = { user_type_id: 'type-123' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_type_id', 'type-123');
    });

    it('should filter by has_employee_id true', async () => {
      const params: UserFilterParams = { has_employee_id: true };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.not).toHaveBeenCalledWith('employee_id', 'is', null);
    });

    it('should filter by has_employee_id false', async () => {
      const params: UserFilterParams = { has_employee_id: false };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.is).toHaveBeenCalledWith('employee_id', null);
    });

    it('should apply role filter with join', async () => {
      const params: UserFilterParams = { role_id: 'role-123' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*, user_roles!inner(role_id)', { count: 'exact' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_roles.role_id', 'role-123');
    });

    it('should apply pagination correctly', async () => {
      const params: UserFilterParams = { page: 3, limit: 10 };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 25,
        error: null
      });

      const result = await getUsers(params);

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(20, 29); // page 3, limit 10
      expect(result.total_pages).toBe(3);
    });

    it('should apply sorting', async () => {
      const params: UserFilterParams = { sort_by: 'email', sort_order: 'asc' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getUsers(params);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('email', { ascending: true });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        count: null,
        error: { message: 'Database error' }
      });

      const result = await getUsers();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0
      });
    });

    it('should handle null data gracefully', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        count: 0,
        error: null
      });

      const result = await getUsers();

      expect(result.data).toEqual([]);
    });
  });

  describe('getUserById', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@test.com',
      first_name: 'Test',
      last_name: 'User',
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

    it('should fetch user by id with relations', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockUser,
        error: null
      });

      const result = await getUserById('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(`
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
    `);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await getUserById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(getUserById('user-123')).rejects.toThrow('Failed to fetch user: Database connection failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'current-user' } }
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: 'current-user', email: 'current@test.com' },
        error: null
      });

      const result = await getCurrentUser();

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'current-user');
      expect(result).toEqual({ id: 'current-user', email: 'current@test.com' });
    });

    it('should return null if no authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getRoles', () => {
    const mockRoles = [
      {
        id: 'role-1',
        name: 'admin',
        display_name: 'Administrator',
        module: { id: 'module-1', name: 'user_management' },
        role_permissions: [
          { permission: { id: 'perm-1', resource: 'users', action: 'create' } }
        ]
      }
    ];

    it('should fetch roles with default parameters', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: mockRoles,
        count: 1,
        error: null
      });

      const result = await getRoles();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('roles');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('priority', { ascending: false });
      expect(result).toEqual({
        data: mockRoles,
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1
      });
    });

    it('should apply search filter', async () => {
      const params: RoleFilterParams = { search: 'admin' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getRoles(params);

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'name.ilike.%admin%,display_name.ilike.%admin%,description.ilike.%admin%'
      );
    });

    it('should filter by module_id', async () => {
      const params: RoleFilterParams = { module_id: 'module-123' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getRoles(params);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('module_id', 'module-123');
    });

    it('should filter by null module_id', async () => {
      const params: RoleFilterParams = { module_id: null };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getRoles(params);

      expect(mockSupabaseClient.is).toHaveBeenCalledWith('module_id', null);
    });

    it('should filter by is_system', async () => {
      const params: RoleFilterParams = { is_system: true };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getRoles(params);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_system', true);
    });
  });

  describe('getRoleById', () => {
    const mockRole = {
      id: 'role-123',
      name: 'admin',
      display_name: 'Administrator',
      module: { id: 'module-1' },
      role_permissions: []
    };

    it('should fetch role by id', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockRole,
        error: null
      });

      const result = await getRoleById('role-123');

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'role-123');
      expect(result).toEqual(mockRole);
    });

    it('should return null for non-existent role', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await getRoleById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getPermissions', () => {
    const mockPermissions = [
      {
        id: 'perm-1',
        module_id: 'module-1',
        resource: 'users',
        action: 'create',
        module: { id: 'module-1', name: 'user_management' }
      }
    ];

    it('should fetch all permissions', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: mockPermissions,
        error: null
      });

      const result = await getPermissions();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('permissions');
      expect(result).toEqual(mockPermissions);
    });

    it('should filter by module_id', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: mockPermissions,
        error: null
      });

      await getPermissions('module-1');

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('module_id', 'module-1');
    });

    it('should handle fetch error', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Permission fetch failed' }
      });

      await expect(getPermissions()).rejects.toThrow('Failed to fetch permissions: Permission fetch failed');
    });
  });

  describe('getUserPermissions', () => {
    it('should fetch current user permissions', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      });

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          { module_name: 'user_management', resource: 'users', action: 'create' },
          { module_name: 'user_management', resource: 'users', action: 'read' },
          { module_name: 'inventory', resource: 'products', action: 'create' }
        ],
        error: null
      });

      const result = await getUserPermissions();

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_user_permissions', {
        p_user_id: 'user-123'
      });
      
      expect(result).toEqual({
        modules: {
          user_management: {
            users: ['create', 'read']
          },
          inventory: {
            products: ['create']
          }
        }
      });
    });

    it('should fetch permissions for specific user', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      await getUserPermissions('user-456');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_user_permissions', {
        p_user_id: 'user-456'
      });
    });

    it('should return empty permissions if no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await getUserPermissions();

      expect(result).toEqual({ modules: {} });
    });

    it('should handle RPC error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      });

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      });

      await expect(getUserPermissions()).rejects.toThrow('Failed to fetch user permissions: RPC failed');
    });
  });

  describe('checkPermission', () => {
    it('should check permission for current user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      });

      mockSupabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const result = await checkPermission('user_management', 'users', 'create');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('has_permission', {
        p_module: 'user_management',
        p_resource: 'users',
        p_action: 'create',
        p_user_id: 'user-123'
      });
      expect(result).toBe(true);
    });

    it('should check permission for specific user', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: false,
        error: null
      });

      const result = await checkPermission('user_management', 'users', 'delete', 'user-456');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('has_permission', {
        p_module: 'user_management',
        p_resource: 'users',
        p_action: 'delete',
        p_user_id: 'user-456'
      });
      expect(result).toBe(false);
    });

    it('should return false if no authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await checkPermission('user_management', 'users', 'create');

      expect(result).toBe(false);
    });

    it('should return false on RPC error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      });

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission check failed' }
      });

      const result = await checkPermission('user_management', 'users', 'create');

      expect(result).toBe(false);
    });
  });

  describe('getModules', () => {
    const mockModules = [
      { id: 'module-1', name: 'user_management', display_name: 'User Management', is_active: true },
      { id: 'module-2', name: 'inventory', display_name: 'Inventory', is_active: true }
    ];

    it('should fetch active modules', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: mockModules,
        error: null
      });

      const result = await getModules();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('modules');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('display_name');
      expect(result).toEqual(mockModules);
    });

    it('should handle fetch error', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Module fetch failed' }
      });

      await expect(getModules()).rejects.toThrow('Failed to fetch modules: Module fetch failed');
    });
  });

  describe('canAccessModule', () => {
    it('should check module access for current user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      });

      mockSupabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const result = await canAccessModule('user_management');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('can_access_module', {
        p_module_name: 'user_management',
        p_user_id: 'user-123'
      });
      expect(result).toBe(true);
    });

    it('should return false if no authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await canAccessModule('user_management');

      expect(result).toBe(false);
    });
  });

  describe('getUserTypes', () => {
    const mockUserTypes = [
      { id: 'type-1', name: 'employee', display_name: 'Employee' },
      { id: 'type-2', name: 'contractor', display_name: 'Contractor' }
    ];

    it('should fetch user types', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: mockUserTypes,
        error: null
      });

      const result = await getUserTypes();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_types');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('display_name');
      expect(result).toEqual(mockUserTypes);
    });

    it('should handle fetch error gracefully', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'User types fetch failed' }
      });

      const result = await getUserTypes();

      expect(result).toEqual([]);
    });
  });

  describe('getActivityLogs', () => {
    const mockLogs = [
      {
        id: 'log-1',
        user_id: 'user-123',
        action: 'user_created',
        created_at: '2024-01-01T00:00:00Z',
        user: { id: 'user-123', email: 'user@test.com' }
      }
    ];

    it('should fetch activity logs with default limit', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const result = await getActivityLogs();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('activity_logs');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockLogs);
    });

    it('should filter by user_id', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      await getActivityLogs('user-123', 25);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(25);
    });

    it('should handle fetch error', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: { message: 'Activity logs fetch failed' }
      });

      await expect(getActivityLogs()).rejects.toThrow('Failed to fetch activity logs: Activity logs fetch failed');
    });
  });

  describe('getUserRoles', () => {
    const mockUserRoles = [
      {
        user_id: 'user-123',
        role_id: 'role-1',
        assigned_at: '2024-01-01T00:00:00Z',
        role: {
          id: 'role-1',
          name: 'admin',
          module: { id: 'module-1' },
          role_permissions: [
            { permission: { id: 'perm-1', resource: 'users', action: 'create' } }
          ]
        }
      }
    ];

    it('should fetch user roles with relations', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: mockUserRoles,
        error: null
      });

      const result = await getUserRoles('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('assigned_at', { ascending: false });
      expect(result).toEqual(mockUserRoles);
    });

    it('should handle fetch error', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'User roles fetch failed' }
      });

      await expect(getUserRoles('user-123')).rejects.toThrow('Failed to fetch user roles: User roles fetch failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseClient.range.mockRejectedValue(new Error('Connection failed'));

      await expect(getUsers()).rejects.toThrow('Connection failed');
    });

    it('should handle null responses gracefully where appropriate', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        count: null,
        error: null
      });

      const result = await getUsers();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should handle type casting correctly', async () => {
      const mockData = { id: 'test', email: 'test@test.com' };
      
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockData],
        count: 1,
        error: null
      });

      const result = await getUsers();

      expect(result.data).toEqual([mockData]);
    });
  });
});