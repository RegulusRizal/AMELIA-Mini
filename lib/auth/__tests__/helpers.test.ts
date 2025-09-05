import {
  checkSuperAdmin,
  getUserRoles,
  hasPermission,
  requireSuperAdmin,
  getAllRoles,
} from '../helpers'

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock Supabase server client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient),
}))

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementations
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })
  })

  describe('checkSuperAdmin', () => {
    it('should return true for user with super_admin role', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [
            {
              role: { id: 'role-1', name: 'super_admin', display_name: 'Super Admin' }
            }
          ],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await checkSuperAdmin()

      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles')
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return false for user without super_admin role', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [
            {
              role: { id: 'role-2', name: 'user', display_name: 'User' }
            }
          ],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await checkSuperAdmin()

      expect(result).toBe(false)
    })

    it('should return false when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const result = await checkSuperAdmin()

      expect(result).toBe(false)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return false when role query fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: new Error('Database error'),
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await checkSuperAdmin()

      expect(result).toBe(false)
    })

    it('should handle array role format correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [
            {
              role: [{ id: 'role-1', name: 'super_admin', display_name: 'Super Admin' }]
            }
          ],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await checkSuperAdmin()

      // Should return false for array format as per the helper logic
      expect(result).toBe(false)
    })
  })

  describe('getUserRoles', () => {
    it('should return roles for specified user ID', async () => {
      const mockRoles = [
        { id: 'role-1', name: 'admin', display_name: 'Admin', description: 'Administrator' },
        { id: 'role-2', name: 'user', display_name: 'User', description: 'Regular user' }
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: mockRoles.map(role => ({ role })),
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await getUserRoles('user-123')

      expect(result).toEqual(mockRoles)
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should get current user roles when no userId provided', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'current-user' } },
        error: null,
      })

      const mockRoles = [
        { id: 'role-1', name: 'user', display_name: 'User', description: 'Regular user' }
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: mockRoles.map(role => ({ role })),
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await getUserRoles()

      expect(result).toEqual(mockRoles)
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'current-user')
    })

    it('should return empty array when user not found', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await getUserRoles()

      expect(result).toEqual([])
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: new Error('Database connection failed'),
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await getUserRoles('user-123')

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user roles:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has required permission', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [{
            role: {
              role_permissions: [{
                permission: {
                  action: 'read',
                  resource: 'users'
                }
              }]
            }
          }],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await hasPermission('read', 'users')

      expect(result).toBe(true)
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return false when user lacks required permission', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [{
            role: {
              role_permissions: [{
                permission: {
                  action: 'read',
                  resource: 'posts'
                }
              }]
            }
          }],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await hasPermission('write', 'users')

      expect(result).toBe(false)
    })

    it('should work with specific user ID', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [{
            role: {
              role_permissions: [{
                permission: {
                  action: 'delete',
                  resource: 'users'
                }
              }]
            }
          }],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await hasPermission('delete', 'users', 'specific-user-id')

      expect(result).toBe(true)
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'specific-user-id')
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: new Error('Permission check failed'),
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await hasPermission('read', 'users')

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Error checking permission:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('requireSuperAdmin', () => {
    it('should not redirect when user is super admin', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [{
            role: { id: 'role-1', name: 'super_admin', display_name: 'Super Admin' }
          }],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      await requireSuperAdmin()

      const { redirect } = require('next/navigation')
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect when user is not super admin', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({
          data: [{
            role: { id: 'role-2', name: 'user', display_name: 'User' }
          }],
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      await requireSuperAdmin()

      const { redirect } = require('next/navigation')
      expect(redirect).toHaveBeenCalledWith('/dashboard?error=unauthorized')
    })
  })

  describe('getAllRoles', () => {
    it('should return all roles ordered by priority', async () => {
      const mockRoles = [
        { id: 'role-1', name: 'super_admin', priority: 100 },
        { id: 'role-2', name: 'admin', priority: 50 },
        { id: 'role-3', name: 'user', priority: 10 }
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.resolve({
          data: mockRoles,
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await getAllRoles()

      expect(result).toEqual(mockRoles)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('roles')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.order).toHaveBeenCalledWith('priority', { ascending: false })
    })

    it('should return empty array on database error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.resolve({
          data: null,
          error: new Error('Database error'),
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await getAllRoles()

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching roles:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle null data gracefully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      }

      mockSupabaseClient.from.mockReturnValueOnce(mockChain)

      const result = await getAllRoles()

      expect(result).toEqual([])
    })
  })
})