# Testing Guide

This guide provides comprehensive information about testing strategies, setup, and best practices for AMELIA-Mini.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Database Testing](#database-testing)
- [Authentication Testing](#authentication-testing)
- [Performance Testing](#performance-testing)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Testing Philosophy

AMELIA-Mini follows the **Testing Pyramid** approach:

```
        /\
       /  \
      / E2E \     <- Few, high-value tests
     /______\
    /        \
   /Integration\ <- More comprehensive tests
  /__________\
 /            \
/  Unit Tests  \   <- Many, fast, focused tests
/______________\
```

### Test Types by Purpose

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components and systems
- **E2E Tests**: Test complete user workflows from start to finish
- **Performance Tests**: Verify system performance under load
- **Security Tests**: Validate authentication and authorization

## Testing Stack

### Core Testing Libraries

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Testing Tools

- **Jest** - Unit and integration testing framework
- **React Testing Library** - React component testing utilities
- **Playwright** - End-to-end testing framework
- **MSW (Mock Service Worker)** - API mocking for tests
- **Vitest** - Fast unit test runner (alternative to Jest)
- **Supabase Test Helpers** - Database testing utilities

## Test Structure

### Directory Structure

```
__tests__/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── lib/               # Utility function tests
│   └── actions/           # Server action tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   ├── database/          # Database operation tests
│   └── auth/              # Authentication flow tests
├── e2e/                   # End-to-end tests
│   ├── user-management/   # User workflow tests
│   ├── authentication/    # Auth workflow tests
│   └── navigation/        # Navigation tests
├── fixtures/              # Test data and mocks
├── helpers/               # Test helper functions
└── setup/                 # Test configuration files
```

### Naming Conventions

```
ComponentName.test.tsx     # Component tests
functionName.test.ts       # Function tests
feature.integration.test.ts # Integration tests
workflow.e2e.test.ts       # E2E tests
```

## Unit Testing

### Component Testing

```tsx
// UserCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserCard } from '@/components/users/UserCard'

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date('2024-01-01')
}

describe('UserCard', () => {
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn()
    const user = userEvent.setup()
    
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />)
    
    await user.click(screen.getByRole('button', { name: /edit/i }))
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser)
  })

  it('does not render edit button when onEdit is not provided', () => {
    render(<UserCard user={mockUser} />)
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
```

### Utility Function Testing

```typescript
// validation.test.ts
import { validateEmail, validatePassword } from '@/lib/validation'

describe('validateEmail', () => {
  it('returns true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
  })

  it('returns false for invalid emails', () => {
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('returns true for strong passwords', () => {
    expect(validatePassword('SecurePass123!')).toBe(true)
  })

  it('returns false for weak passwords', () => {
    expect(validatePassword('123')).toBe(false)
    expect(validatePassword('password')).toBe(false)
  })
})
```

### Server Action Testing

```typescript
// userActions.test.ts
import { createUser } from '@/app/users/actions'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates user successfully', async () => {
    const mockClient = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: { id: '123', email: 'test@example.com' } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      })
    }
    
    mockSupabase.mockResolvedValue(mockClient as any)

    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')
    formData.append('firstName', 'John')
    formData.append('lastName', 'Doe')

    const result = await createUser(formData)

    expect(result.success).toBe(true)
    expect(mockClient.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('handles validation errors', async () => {
    const formData = new FormData()
    formData.append('email', 'invalid-email')

    const result = await createUser(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid email')
  })
})
```

## Integration Testing

### API Endpoint Testing

```typescript
// api.integration.test.ts
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/users/route'
import { createTestClient } from '@/lib/test-utils'

describe('/api/users', () => {
  let supabase: any

  beforeEach(() => {
    supabase = createTestClient()
  })

  it('returns users for authenticated admin', async () => {
    // Mock authenticated admin user
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ role: 'admin' }],
          error: null
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/users')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.users)).toBe(true)
  })

  it('returns 403 for non-admin users', async () => {
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null
    })

    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ role: 'employee' }],
          error: null
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/users')
    const response = await GET()

    expect(response.status).toBe(403)
  })
})
```

### Database Integration Testing

```typescript
// database.integration.test.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
)

describe('User Management Database Operations', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('profiles').delete().neq('id', '')
    await supabase.from('user_roles').delete().neq('id', '')
  })

  it('creates user profile with RLS policies', async () => {
    // Create test user
    const { data: user } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    })

    // Create profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.user!.id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com'
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(profile.first_name).toBe('John')
    expect(profile.last_name).toBe('Doe')
  })

  it('enforces RLS policies', async () => {
    // Try to access another user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('user_id', 'another-user-id')

    expect(data).toEqual([])
    // Should not return error, just empty array due to RLS
  })
})
```

## End-to-End Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Example

```typescript
// user-management.e2e.test.ts
import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('creates new user', async ({ page }) => {
    // Navigate to users page
    await page.goto('/users')
    await page.click('text=Add User')

    // Fill out form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', 'securePassword123')
    
    // Select role
    await page.click('select[name="role"]')
    await page.selectOption('select[name="role"]', 'employee')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('text=User created successfully')).toBeVisible()
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('edits existing user', async ({ page }) => {
    await page.goto('/users')
    
    // Click edit button for first user
    await page.click('[data-testid="user-row"]:first-child [data-testid="edit-button"]')
    
    // Update name
    await page.fill('input[name="firstName"]', 'Jane')
    await page.click('button[type="submit"]')
    
    // Verify update
    await expect(page.locator('text=User updated successfully')).toBeVisible()
    await expect(page.locator('text=Jane')).toBeVisible()
  })

  test('deletes user', async ({ page }) => {
    await page.goto('/users')
    
    // Click delete button
    await page.click('[data-testid="user-row"]:first-child [data-testid="delete-button"]')
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")')
    
    // Verify deletion
    await expect(page.locator('text=User deleted successfully')).toBeVisible()
  })
})
```

### Authentication E2E Testing

```typescript
// auth.e2e.test.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login flow', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('handles invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/users')
    await page.waitForURL('/auth/login')
    await expect(page).toHaveURL('/auth/login')
  })
})
```

## Database Testing

### Test Database Setup

```sql
-- Create test database schema
CREATE SCHEMA test_schema;

-- Copy production tables to test schema
CREATE TABLE test_schema.profiles AS SELECT * FROM public.profiles WHERE 1=0;
CREATE TABLE test_schema.roles AS SELECT * FROM public.roles WHERE 1=0;
CREATE TABLE test_schema.user_roles AS SELECT * FROM public.user_roles WHERE 1=0;

-- Create test data seeding function
CREATE OR REPLACE FUNCTION test_schema.seed_test_data()
RETURNS void AS $$
BEGIN
  -- Insert test roles
  INSERT INTO test_schema.roles (id, name, description) VALUES
    ('admin-role-id', 'admin', 'Administrative access'),
    ('employee-role-id', 'employee', 'Employee access');
    
  -- Insert test users
  INSERT INTO test_schema.profiles (id, user_id, first_name, last_name, email) VALUES
    ('test-user-1', 'auth-user-1', 'John', 'Doe', 'john@example.com'),
    ('test-user-2', 'auth-user-2', 'Jane', 'Smith', 'jane@example.com');
END;
$$ LANGUAGE plpgsql;
```

### RLS Policy Testing

```typescript
// rls-policies.test.ts
describe('Row Level Security Policies', () => {
  it('allows users to view own profile', async () => {
    // Login as user
    await supabase.auth.signIn({
      email: 'john@example.com',
      password: 'password123'
    })

    // Should be able to view own profile
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('email', 'john@example.com')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('prevents users from viewing other profiles', async () => {
    await supabase.auth.signIn({
      email: 'john@example.com',
      password: 'password123'
    })

    // Should not be able to view other user's profile
    const { data } = await supabase
      .from('profiles')
      .select()
      .eq('email', 'jane@example.com')

    expect(data).toHaveLength(0)
  })

  it('allows admins to view all profiles', async () => {
    await supabase.auth.signIn({
      email: 'admin@example.com',
      password: 'password123'
    })

    const { data, error } = await supabase
      .from('profiles')
      .select()

    expect(error).toBeNull()
    expect(data.length).toBeGreaterThan(1)
  })
})
```

## Performance Testing

### Load Testing with Artillery

```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer {{ $randomString() }}'

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/api/users"
      - think: 1
      - post:
          url: "/api/users"
          json:
            firstName: "Load"
            lastName: "Test"
            email: "load{{ $randomNumber(1, 1000) }}@example.com"
```

### Performance Benchmarks

```typescript
// performance.test.ts
import { performance } from 'perf_hooks'

describe('Performance Benchmarks', () => {
  it('user creation should complete within 500ms', async () => {
    const start = performance.now()
    
    await createUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'perf@example.com',
      password: 'password123'
    })
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeLessThan(500)
  })

  it('user list should load within 200ms', async () => {
    const start = performance.now()
    
    await getUsersList({ limit: 50 })
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeLessThan(200)
  })
})
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Coverage Requirements

- **Minimum Overall Coverage**: 80%
- **Critical Functions**: 95% coverage required
  - Authentication functions
  - User management actions
  - Security-related code
- **UI Components**: 70% coverage minimum
- **Integration Points**: 90% coverage required

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage:check
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_TEST_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_TEST_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
          
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Best Practices

### General Testing Principles

1. **Write Tests First**: Follow TDD when possible
2. **Test Behavior**: Focus on what the code does, not how
3. **Keep Tests Simple**: One assertion per test when possible
4. **Use Descriptive Names**: Test names should explain the scenario
5. **Arrange-Act-Assert**: Structure tests clearly

### Component Testing Best Practices

```tsx
// Good: Test user interactions
test('submits form when valid data is entered', async () => {
  const mockOnSubmit = jest.fn()
  const user = userEvent.setup()
  
  render(<UserForm onSubmit={mockOnSubmit} />)
  
  await user.type(screen.getByLabelText(/first name/i), 'John')
  await user.type(screen.getByLabelText(/last name/i), 'Doe')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(mockOnSubmit).toHaveBeenCalledWith({
    firstName: 'John',
    lastName: 'Doe'
  })
})

// Bad: Test implementation details
test('updates state when input changes', () => {
  // Don't test internal state changes
})
```

### Mock Strategy

```typescript
// Mock external dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Use MSW for API mocking
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', name: 'John Doe' }
    ]))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Test Data Management

```typescript
// Use factories for test data
export const createUser = (overrides = {}) => ({
  id: 'test-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date(),
  ...overrides
})

// Use realistic test data
const testUsers = [
  createUser({ email: 'admin@company.com', role: 'admin' }),
  createUser({ email: 'manager@company.com', role: 'manager' }),
  createUser({ email: 'employee@company.com', role: 'employee' })
]
```

### Debugging Tests

```bash
# Run single test file
npm test UserCard.test.tsx

# Run tests in watch mode
npm test -- --watch

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run tests with verbose output
npm test -- --verbose
```

### Common Testing Patterns

```typescript
// Testing async operations
test('handles async operations', async () => {
  const promise = asyncFunction()
  
  // Test loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})

// Testing error conditions
test('displays error message on failure', async () => {
  // Mock failure
  jest.spyOn(api, 'createUser').mockRejectedValue(new Error('Failed'))
  
  render(<UserForm />)
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  await waitFor(() => {
    expect(screen.getByText('Failed to create user')).toBeInTheDocument()
  })
})
```

---

This testing guide should be updated as new testing patterns and tools are adopted in the project. For questions about testing, refer to the team's testing channel or create an issue.