import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import UsersPage from '../page';
import { createClient } from '@/lib/supabase/server';
import { checkSuperAdmin } from '@/lib/auth/helpers';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

// Mock auth helpers
jest.mock('@/lib/auth/helpers', () => ({
  checkSuperAdmin: jest.fn()
}));

// Mock dialogs
jest.mock('../components/add-user-dialog', () => ({
  AddUserDialog: ({ children }: { children?: React.ReactNode }) => 
    children || <button data-testid="add-user-dialog">Add User</button>
}));

jest.mock('../components/user-actions', () => ({
  UserActions: ({ user }: { user: any }) => 
    <div data-testid="user-actions">{user.email}</div>
}));

// Mock cache data fetchers
jest.mock('@/lib/cache/data-fetchers', () => ({
  getCachedUsers: jest.fn()
}));

describe('UsersPage', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn(() => mockSupabaseClient),
      select: jest.fn(() => mockSupabaseClient),
      order: jest.fn(() => mockSupabaseClient),
      eq: jest.fn(() => mockSupabaseClient),
      or: jest.fn(() => mockSupabaseClient),
      range: jest.fn(() => mockSupabaseClient)
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('Authentication', () => {
    it('should redirect to login if user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      await UsersPage({});

      expect(redirect).toHaveBeenCalledWith('/auth/login');
    });

    it('should redirect to login if authentication error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error')
      });

      await UsersPage({});

      expect(redirect).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null
      });
    });

    it('should render access denied for non-super admin', async () => {
      (checkSuperAdmin as jest.Mock).mockResolvedValue(false);

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Access Denied');
      expect(container.textContent).toContain("You don't have permission to access User Management");
      expect(container.textContent).toContain('Only super administrators can manage users and roles');
    });

    it('should render users page for super admin', async () => {
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
      
      // Mock successful data fetching
      mockSupabaseClient.select.mockResolvedValue({
        data: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            display_name: 'User One',
            first_name: 'User',
            last_name: 'One',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            user_roles: [
              {
                role_id: 'role-1',
                role: { id: 'role-1', name: 'admin', display_name: 'Administrator' }
              }
            ]
          }
        ],
        count: 1,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('User Management');
      expect(container.textContent).toContain('Manage users, roles, and permissions');
    });
  });

  describe('User Data Display', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
    });

    it('should display user statistics correctly', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@test.com', status: 'active', created_at: '2024-01-01T00:00:00Z', user_roles: [] },
        { id: 'user-2', email: 'user2@test.com', status: 'inactive', created_at: '2024-01-01T00:00:00Z', user_roles: [] },
        { id: 'user-3', email: 'user3@test.com', status: 'suspended', created_at: '2024-01-01T00:00:00Z', user_roles: [] },
        { id: 'user-4', email: 'user4@test.com', status: 'active', created_at: '2024-01-01T00:00:00Z', user_roles: [] }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockUsers,
        count: 4,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('4'); // Total users
      expect(container.textContent).toContain('2'); // Active users (counting occurrences)
      expect(container.textContent).toContain('1'); // Inactive users
      expect(container.textContent).toContain('1'); // Suspended users
    });

    it('should display user list with correct information', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'john@test.com',
          display_name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe',
          employee_id: 'EMP001',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          user_roles: [
            {
              role_id: 'role-1',
              role: { id: 'role-1', name: 'admin', display_name: 'Administrator' }
            }
          ]
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockUsers,
        count: 1,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('John Doe');
      expect(container.textContent).toContain('john@test.com');
      expect(container.textContent).toContain('EMP: EMP001');
      expect(container.textContent).toContain('Administrator');
    });

    it('should handle users without roles', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'norole@test.com',
          display_name: 'No Role User',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          user_roles: []
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockUsers,
        count: 1,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('No role');
    });

    it('should display empty state when no users found', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('No users found');
      expect(container.textContent).toContain('Get started by creating a new user');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
    });

    it('should apply search filter', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await UsersPage({ 
        searchParams: { search: 'john', status: 'all' } 
      });

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'email.ilike.%john%,display_name.ilike.%john%,first_name.ilike.%john%,last_name.ilike.%john%'
      );
    });

    it('should apply status filter', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await UsersPage({ 
        searchParams: { status: 'active' } 
      });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should not apply status filter for "all"', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await UsersPage({ 
        searchParams: { status: 'all' } 
      });

      expect(mockSupabaseClient.eq).not.toHaveBeenCalledWith('status', 'all');
    });

    it('should show search-specific empty state', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      const result = await UsersPage({ 
        searchParams: { search: 'nonexistent' } 
      });
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Try adjusting your search criteria');
      expect(container.textContent).not.toContain('Get started by creating a new user');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
    });

    it('should apply correct pagination', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 25,
        error: null
      });

      await UsersPage({ 
        searchParams: { page: '3' } 
      });

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(20, 29); // page 3, offset 20
    });

    it('should default to page 1', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 5,
        error: null
      });

      await UsersPage({});

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9); // page 1, offset 0
    });

    it('should display pagination controls for multiple pages', async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        user_roles: []
      }));

      mockSupabaseClient.select.mockResolvedValue({
        data: mockUsers,
        count: 25, // More than 10, so we have multiple pages
        error: null
      });

      const result = await UsersPage({ searchParams: { page: '2' } });
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Showing 10 of 25 users');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        count: 0,
        error: new Error('Database connection failed')
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      // Should still render the page structure without users
      expect(container.textContent).toContain('User Management');
      expect(container.textContent).toContain('No users found');
    });
  });

  describe('Role Data Fetching', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
    });

    it('should fetch available roles for add user dialog', async () => {
      mockSupabaseClient.select
        .mockResolvedValueOnce({
          data: [{ id: 'user-1', email: 'test@test.com', status: 'active', created_at: '2024-01-01T00:00:00Z', user_roles: [] }],
          count: 1,
          error: null
        })
        .mockResolvedValueOnce({
          data: [
            { id: 'role-1', name: 'admin', display_name: 'Administrator' },
            { id: 'role-2', name: 'user', display_name: 'Regular User' }
          ],
          error: null
        });

      await UsersPage({});

      // Verify roles query
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, name, display_name');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('priority', { ascending: false });
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
    });

    it('should render AddUserDialog component', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.querySelector('[data-testid="add-user-dialog"]')).toBeInTheDocument();
    });

    it('should render UserActions for each user', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@test.com', status: 'active', created_at: '2024-01-01T00:00:00Z', user_roles: [] },
        { id: 'user-2', email: 'user2@test.com', status: 'active', created_at: '2024-01-01T00:00:00Z', user_roles: [] }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockUsers,
        count: 2,
        error: null
      });

      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      const userActions = container.querySelectorAll('[data-testid="user-actions"]');
      expect(userActions).toHaveLength(2);
      expect(userActions[0].textContent).toContain('user1@test.com');
      expect(userActions[1].textContent).toContain('user2@test.com');
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@test.com' } },
        error: null
      });
      (checkSuperAdmin as jest.Mock).mockResolvedValue(true);
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });
    });

    it('should render navigation links', async () => {
      const result = await UsersPage({});
      const { container } = render(result as React.ReactElement);

      expect(container.querySelector('a[href="/dashboard"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/users/roles"]')).toBeInTheDocument();
    });
  });
});