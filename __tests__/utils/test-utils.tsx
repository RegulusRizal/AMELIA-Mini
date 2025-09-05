// Test utilities for user management tests

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock data generators for consistent testing
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  display_name: 'Test User',
  phone: '+1234567890',
  employee_id: 'EMP001',
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockRole = (overrides = {}) => ({
  id: 'role-123',
  name: 'test_role',
  display_name: 'Test Role',
  description: 'A test role for testing purposes',
  module_id: 'module-123',
  is_system: false,
  priority: 10,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockPermission = (overrides = {}) => ({
  id: 'perm-123',
  module_id: 'module-123',
  resource: 'users',
  action: 'create',
  description: 'Create users',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockModule = (overrides = {}) => ({
  id: 'module-123',
  name: 'user_management',
  display_name: 'User Management',
  description: 'Manage users and roles',
  is_active: true,
  required_employee: false,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

// Mock Supabase client builder
export const createMockSupabaseClient = (overrides = {}) => ({
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  upsert: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  lte: jest.fn(() => mockSupabaseClient),
  like: jest.fn(() => mockSupabaseClient),
  ilike: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  not: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  and: jest.fn(() => mockSupabaseClient),
  in: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(() => mockSupabaseClient),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: 'current-user-id' } },
      error: null
    })),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    admin: {
      createUser: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
      inviteUserByEmail: jest.fn()
    }
  },
  storage: {
    from: jest.fn()
  },
  ...overrides
});

// Create a reference to use in chainable methods
const mockSupabaseClient = createMockSupabaseClient();

// Form data test helper
export const createFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Common test scenarios
export const commonTestScenarios = {
  users: [
    createMockUser(),
    createMockUser({ 
      id: 'user-456',
      email: 'user2@example.com', 
      status: 'inactive',
      display_name: 'Inactive User'
    }),
    createMockUser({ 
      id: 'user-789',
      email: 'user3@example.com', 
      status: 'suspended',
      display_name: 'Suspended User'
    })
  ],
  roles: [
    createMockRole(),
    createMockRole({ 
      id: 'role-456',
      name: 'admin',
      display_name: 'Administrator',
      is_system: true,
      priority: 100
    }),
    createMockRole({ 
      id: 'role-789',
      name: 'manager',
      display_name: 'Manager',
      priority: 50
    })
  ],
  permissions: [
    createMockPermission(),
    createMockPermission({ 
      id: 'perm-456',
      resource: 'roles',
      action: 'read',
      description: 'Read roles'
    }),
    createMockPermission({ 
      id: 'perm-789',
      resource: 'permissions',
      action: 'update',
      description: 'Update permissions'
    })
  ]
};

// Error scenarios for testing
export const errorScenarios = {
  databaseError: { message: 'Database connection failed', code: 'DB_ERROR' },
  authError: { message: 'Authentication failed', code: 'AUTH_ERROR' },
  validationError: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
  notFoundError: { message: 'Resource not found', code: 'PGRST116' },
  duplicateError: { message: 'Duplicate entry', code: 'DUPLICATE_ERROR' }
};

// Test assertion helpers
export const expectSuccessResult = (result: any) => {
  expect(result).toHaveProperty('success', true);
  expect(result).not.toHaveProperty('error');
};

export const expectErrorResult = (result: any, expectedMessage?: string) => {
  expect(result).toHaveProperty('error');
  expect(result).not.toHaveProperty('success', true);
  if (expectedMessage) {
    expect(result.error).toBe(expectedMessage);
  }
};

export const expectPaginatedResult = (result: any, expectedTotal?: number) => {
  expect(result).toHaveProperty('data');
  expect(result).toHaveProperty('total');
  expect(result).toHaveProperty('page');
  expect(result).toHaveProperty('limit');
  expect(result).toHaveProperty('total_pages');
  expect(Array.isArray(result.data)).toBe(true);
  
  if (expectedTotal !== undefined) {
    expect(result.total).toBe(expectedTotal);
  }
};

// Custom render function with common providers if needed
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    // Add any common providers here if needed
    ...options,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Wait for async operations in tests
export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock timers helper
export const advanceTimers = (ms: number) => {
  if (jest.isMockFunction(setTimeout)) {
    jest.advanceTimersByTime(ms);
  }
};

// Database query assertion helpers
export const expectDatabaseQuery = (mockClient: any, table: string, method: string) => {
  expect(mockClient.from).toHaveBeenCalledWith(table);
  if (method !== 'from') {
    expect(mockClient[method]).toHaveBeenCalled();
  }
};

export const expectSupabaseCall = (mockClient: any, table: string) => {
  expect(mockClient.from).toHaveBeenCalledWith(table);
};

// Form submission test helper
export const submitForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  Object.entries(data).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
    if (input) {
      input.value = value;
    }
  });
  
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(submitEvent);
  
  // Wait for any async operations
  await waitForAsync();
};

// Local storage mock for testing
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  return localStorageMock;
};

// Session storage mock for testing
export const mockSessionStorage = () => {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });
  
  return sessionStorageMock;
};

// Window location mock for testing
export const mockLocation = (url = 'http://localhost:3000') => {
  delete (window as any).location;
  window.location = new URL(url) as any;
};

// Console spy utilities
export const spyConsole = () => ({
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  info: jest.spyOn(console, 'info').mockImplementation(() => {})
});

// Cleanup helper for tests
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  if (jest.isMockFunction(fetch)) {
    (fetch as jest.Mock).mockClear();
  }
};