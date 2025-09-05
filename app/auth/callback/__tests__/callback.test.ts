import { GET } from '../route'

// Mock Supabase server client
const mockExchangeCodeForSession = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: string) => ({ url })),
  },
}))

describe('Auth Callback Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /auth/callback', () => {
    it('should exchange code for session and redirect to dashboard', async () => {
      const { NextResponse } = require('next/server')
      
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const request = {
        url: 'https://example.com/auth/callback?code=auth-code-123',
      } as any

      await GET(request)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('auth-code-123')
      expect(NextResponse.redirect).toHaveBeenCalledWith('https://example.com/dashboard')
    })

    it('should redirect to custom next URL when provided', async () => {
      const { NextResponse } = require('next/server')
      
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const request = {
        url: 'https://example.com/auth/callback?code=auth-code-123&next=/users',
      } as any

      await GET(request)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('auth-code-123')
      expect(NextResponse.redirect).toHaveBeenCalledWith('https://example.com/users')
    })

    it('should redirect to login with error when code exchange fails', async () => {
      const { NextResponse } = require('next/server')
      
      mockExchangeCodeForSession.mockResolvedValueOnce({ 
        error: new Error('Invalid code') 
      })

      const request = {
        url: 'https://example.com/auth/callback?code=invalid-code',
      } as any

      await GET(request)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('invalid-code')
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'https://example.com/auth/login?error=Could not authenticate user'
      )
    })

    it('should redirect to login when no code is provided', async () => {
      const { NextResponse } = require('next/server')

      const request = {
        url: 'https://example.com/auth/callback',
      } as any

      await GET(request)

      expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'https://example.com/auth/login?error=Could not authenticate user'
      )
    })

    it('should handle URL parsing correctly', async () => {
      const { NextResponse } = require('next/server')
      
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const request = {
        url: 'https://myapp.vercel.app/auth/callback?code=production-code&next=/profile&other=param',
      } as any

      await GET(request)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('production-code')
      expect(NextResponse.redirect).toHaveBeenCalledWith('https://myapp.vercel.app/profile')
    })

    it('should handle empty next parameter correctly', async () => {
      const { NextResponse } = require('next/server')
      
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const request = {
        url: 'https://example.com/auth/callback?code=auth-code-123&next=',
      } as any

      await GET(request)

      // When next is empty string, it should redirect to origin + empty string
      expect(NextResponse.redirect).toHaveBeenCalledWith('https://example.com')
    })
  })
})