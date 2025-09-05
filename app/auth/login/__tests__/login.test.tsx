import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'

// Mock Next.js router
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Get the mocked Supabase client from global setup
const mockSupabaseClient = global.mockSupabaseClient

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset all mock implementations
    mockSupabaseClient.auth.signInWithPassword.mockReset()
    mockSupabaseClient.auth.signUp.mockReset()
  })

  it('renders login form with all required fields', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account? Sign Up")).toBeInTheDocument()
  })

  it('toggles between sign in and sign up modes', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    
    await user.click(screen.getByText("Don't have an account? Sign Up"))
    
    expect(screen.getByText('Create an Account')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
    expect(screen.getByText('Already have an account? Sign In')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('handles successful sign in', async () => {
    const user = userEvent.setup()
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('handles sign in error', async () => {
    const user = userEvent.setup()
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles successful sign up', async () => {
    const user = userEvent.setup()
    
    mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'new-user-id', email: 'new@example.com' } },
      error: null,
    })
    
    render(<LoginPage />)
    
    // Switch to sign up mode
    await user.click(screen.getByText("Don't have an account? Sign Up"))
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign Up' })
    
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpassword123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword123',
        options: {
          emailRedirectTo: 'http://localhost/auth/callback',
        },
      })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Check your email to confirm your account!')).toBeInTheDocument()
    })
  })

  it('handles sign up error', async () => {
    const user = userEvent.setup()
    
    mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email already registered' },
    })
    
    render(<LoginPage />)
    
    // Switch to sign up mode
    await user.click(screen.getByText("Don't have an account? Sign Up"))
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign Up' })
    
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100))
    )
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Check that button shows loading state and inputs are disabled
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeInTheDocument()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
  })

  it('clears errors when switching between modes', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    // Trigger a validation error
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    })
    
    // Switch to sign up mode
    await user.click(screen.getByText("Don't have an account? Sign Up"))
    
    // Error should be cleared
    expect(screen.queryByText('Please fill in all fields')).not.toBeInTheDocument()
  })
})