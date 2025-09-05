# API Documentation

This document provides comprehensive documentation for all API endpoints and server actions available in AMELIA-Mini.

## Table of Contents

- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Server Actions](#server-actions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Authentication

AMELIA-Mini uses Supabase Authentication with JWT tokens. All protected endpoints require a valid session token.

### Authentication Flow

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Logout
await supabase.auth.signOut()
```

### Authorization

The application implements Role-Based Access Control (RBAC):

- **super_admin** - Full system access
- **admin** - Administrative functions
- **manager** - Department management
- **employee** - Basic user access

## API Endpoints

### Test Endpoints

#### GET /api/test

Tests Supabase connection and authentication status.

**Authentication**: Required (super_admin only)

**Environment**: Development only (returns 404 in production)

**Response**:
```json
{
  "status": "success",
  "message": "Successfully connected to Supabase!",
  "timestamp": "2025-01-05T12:00:00.000Z",
  "auth": {
    "connected": true,
    "hasUser": true
  },
  "database": {
    "connected": true
  }
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Failed to connect to Supabase",
  "error": "Connection timeout"
}
```

#### GET /api/debug

Returns system debug information including user count and role statistics.

**Authentication**: Required (super_admin only)

**Environment**: Development only

**Response**:
```json
{
  "status": "success",
  "timestamp": "2025-01-05T12:00:00.000Z",
  "database": {
    "connected": true,
    "userCount": 25,
    "roleCount": 4
  },
  "auth": {
    "userId": "uuid-string",
    "email": "admin@example.com"
  }
}
```

#### GET /api/debug-users

Lists all users with their roles (limited information for security).

**Authentication**: Required (super_admin only)

**Environment**: Development only

**Response**:
```json
{
  "users": [
    {
      "id": "uuid-string",
      "email": "user@example.com",
      "role": "employee",
      "created_at": "2025-01-05T12:00:00.000Z"
    }
  ]
}
```

### Role Management

#### GET /api/roles

Retrieves all available roles in the system.

**Authentication**: Required (admin or higher)

**Response**:
```json
{
  "roles": [
    {
      "id": "uuid-string",
      "name": "admin",
      "description": "Administrative access",
      "created_at": "2025-01-05T12:00:00.000Z"
    }
  ]
}
```

### Cache Management

#### GET /api/cache-stats

Returns caching statistics and performance metrics.

**Authentication**: Required (admin or higher)

**Response**:
```json
{
  "cache": {
    "hits": 1250,
    "misses": 150,
    "hitRate": 0.89,
    "size": "15.2MB"
  },
  "timestamp": "2025-01-05T12:00:00.000Z"
}
```

## Server Actions

Server actions provide type-safe server-side operations for data manipulation.

### User Management Actions

#### `createUser(formData: FormData)`

Creates a new user in the system.

**Location**: `app/users/actions.ts`

**Parameters**:
- `email` (string) - User email address
- `password` (string) - User password
- `firstName` (string) - User first name
- `lastName` (string) - User last name
- `role` (string, optional) - User role (defaults to 'employee')

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
  data?: UserProfile;
}>
```

**Example**:
```typescript
const formData = new FormData()
formData.append('email', 'user@example.com')
formData.append('password', 'securePassword')
formData.append('firstName', 'John')
formData.append('lastName', 'Doe')

const result = await createUser(formData)
```

#### `updateUser(formData: FormData)`

Updates an existing user's information.

**Location**: `app/users/actions.ts`

**Parameters**:
- `id` (string) - User ID
- `email` (string, optional) - Updated email
- `firstName` (string, optional) - Updated first name
- `lastName` (string, optional) - Updated last name

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
  data?: UserProfile;
}>
```

#### `deleteUser(formData: FormData)`

Deletes a user from the system.

**Location**: `app/users/actions.ts`

**Parameters**:
- `id` (string) - User ID to delete

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
}>
```

### Role Management Actions

#### `createRole(formData: FormData)`

Creates a new role in the system.

**Location**: `app/users/roles/actions.ts`

**Parameters**:
- `name` (string) - Role name
- `description` (string, optional) - Role description

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
  data?: Role;
}>
```

#### `updateRole(formData: FormData)`

Updates an existing role.

**Location**: `app/users/roles/actions.ts`

**Parameters**:
- `id` (string) - Role ID
- `name` (string, optional) - Updated name
- `description` (string, optional) - Updated description

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
  data?: Role;
}>
```

#### `deleteRole(formData: FormData)`

Deletes a role from the system.

**Location**: `app/users/roles/actions.ts`

**Parameters**:
- `id` (string) - Role ID to delete

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
}>
```

#### `assignUserRole(formData: FormData)`

Assigns a role to a user.

**Location**: `app/users/roles/actions.ts`

**Parameters**:
- `userId` (string) - User ID
- `roleId` (string) - Role ID

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
}>
```

### Profile Actions

#### `updateProfile(formData: FormData)`

Updates the current user's profile information.

**Location**: `app/profile/actions.ts`

**Parameters**:
- `firstName` (string, optional) - Updated first name
- `lastName` (string, optional) - Updated last name
- `bio` (string, optional) - User bio
- `phone` (string, optional) - Phone number

**Returns**:
```typescript
Promise<{
  success: boolean;
  error?: string;
  data?: Profile;
}>
```

## Error Handling

All API endpoints and server actions follow consistent error handling patterns.

### HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate data)
- `500` - Internal server error

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Validation error details"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already exists
- `DATABASE_ERROR` - Database operation failed
- `RLS_VIOLATION` - Row Level Security violation

## Rate Limiting

API endpoints are protected by rate limiting:

- **Authentication endpoints**: 5 requests per minute per IP
- **User management**: 30 requests per minute per user
- **Data retrieval**: 100 requests per minute per user
- **Cache endpoints**: 10 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1625097600
```

## Data Schemas

### User Profile

```typescript
interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
  role?: string
}
```

### Role

```typescript
interface Role {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

### Profile

```typescript
interface Profile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  bio?: string
  phone?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}
```

## Examples

### Complete User Creation Flow

```typescript
// 1. Create user account
const createResult = await createUser(formData)
if (!createResult.success) {
  throw new Error(createResult.error)
}

// 2. Assign role to user
const roleData = new FormData()
roleData.append('userId', createResult.data!.id)
roleData.append('roleId', 'employee-role-id')

const roleResult = await assignUserRole(roleData)
if (!roleResult.success) {
  throw new Error(roleResult.error)
}

// 3. Update user profile
const profileData = new FormData()
profileData.append('firstName', 'John')
profileData.append('lastName', 'Doe')
profileData.append('bio', 'Software Developer')

await updateProfile(profileData)
```

### Error Handling Example

```typescript
try {
  const result = await createUser(formData)
  
  if (!result.success) {
    // Handle business logic errors
    if (result.error?.includes('Email already exists')) {
      toast.error('This email is already registered')
      return
    }
    
    // Handle other errors
    toast.error(result.error || 'Failed to create user')
    return
  }
  
  // Handle success
  toast.success('User created successfully')
  router.push('/users')
  
} catch (error) {
  // Handle network/system errors
  console.error('Unexpected error:', error)
  toast.error('System error occurred')
}
```

### Pagination Example

```typescript
// Using Supabase pagination
const { data: users, error } = await supabase
  .from('profiles')
  .select('*')
  .range(0, 9) // First 10 items
  .order('created_at', { ascending: false })

// Next page
const { data: nextUsers } = await supabase
  .from('profiles')
  .select('*')
  .range(10, 19) // Next 10 items
  .order('created_at', { ascending: false })
```

## Security Considerations

1. **Row Level Security (RLS)**: All database tables use RLS policies
2. **Input Validation**: All inputs are validated using Zod schemas
3. **SQL Injection Protection**: Parameterized queries prevent SQL injection
4. **CSRF Protection**: Server actions include CSRF protection
5. **Environment Variables**: Sensitive data stored in environment variables

## Testing API Endpoints

Use the following approaches to test API endpoints:

### Using curl

```bash
# Test connection (requires super_admin)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/test

# Get roles
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/roles
```

### Using Postman

1. Set up environment variables for base URL and token
2. Include Authorization header: `Bearer YOUR_JWT_TOKEN`
3. Use appropriate HTTP methods for each endpoint

### Using Next.js Test Utils

```typescript
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/test/route'

// Mock request
const request = new NextRequest('http://localhost:3000/api/test')

// Test endpoint
const response = await GET()
const data = await response.json()

expect(response.status).toBe(200)
expect(data.status).toBe('success')
```

---

This documentation is updated with each release. For the latest API changes, check the [CHANGELOG.md](../CHANGELOG.md) file.