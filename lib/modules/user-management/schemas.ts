// User Management Validation Schemas
import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  display_name: z.string().optional(),
  phone: z.string().optional(),
  employee_id: z.string().optional().nullable(),
  user_type_id: z.string().uuid('Invalid user type ID').optional(),
  roles: z.array(z.string().uuid()).optional(),
});

export const updateUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  display_name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  user_type_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  preferences: z.record(z.string(), z.any()).optional(),
  notification_settings: z.record(z.string(), z.any()).optional(),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  user_type_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']),
  last_active_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Role schemas
export const createRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .regex(/^[a-z_]+$/, 'Role name must be lowercase with underscores only'),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  module_id: z.string().uuid().optional().nullable(),
  permissions: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = z.object({
  display_name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string().uuid()).optional(),
});

export const assignRoleSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role_id: z.string().uuid('Invalid role ID'),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Permission schemas
export const permissionCheckSchema = z.object({
  module: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
});

// Filter schemas
export const userFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  user_type_id: z.string().uuid().optional(),
  has_employee_id: z.boolean().optional(),
  role_id: z.string().uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sort_by: z.string().optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const roleFilterSchema = z.object({
  search: z.string().optional(),
  module_id: z.string().uuid().optional(),
  is_system: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sort_by: z.string().optional().default('priority'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type exports from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type PermissionCheck = z.infer<typeof permissionCheckSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;
export type RoleFilter = z.infer<typeof roleFilterSchema>;