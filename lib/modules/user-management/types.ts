// User Management Types and Interfaces

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  
  // Optional HR link
  employee_id?: string | null;
  
  // User type
  user_type_id?: string | null;
  user_type?: UserType;
  
  // Preferences
  preferences?: Record<string, any>;
  notification_settings?: Record<string, any>;
  
  // System
  status: 'active' | 'inactive' | 'suspended';
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  roles?: UserRole[];
}

export interface UserType {
  id: string;
  name: string;
  display_name: string;
  requires_employee_id: boolean;
  default_roles?: string[];
  created_at: string;
}

export interface Module {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  icon?: string | null;
  base_route?: string | null;
  is_active: boolean;
  required_employee: boolean;
  settings?: Record<string, any>;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  module_id?: string | null;
  module?: Module;
  is_system: boolean;
  priority: number;
  created_at: string;
  permissions?: RolePermission[];
}

export interface Permission {
  id: string;
  module_id: string;
  module?: Module;
  resource: string;
  action: string;
  description?: string | null;
  conditions?: Record<string, any>;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted_at: string;
  permission?: Permission;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_by?: string | null;
  assigned_at: string;
  expires_at?: string | null;
  metadata?: Record<string, any>;
  role?: Role;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  action: string;
  module?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  changes?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: UserProfile;
}

// Derived types for forms and API
export interface CreateUserInput {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  employee_id?: string;
  user_type_id?: string;
  roles?: string[];
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  employee_id?: string;
  user_type_id?: string;
  status?: 'active' | 'inactive' | 'suspended';
  preferences?: Record<string, any>;
  notification_settings?: Record<string, any>;
}

export interface CreateRoleInput {
  name: string;
  display_name: string;
  description?: string;
  module_id?: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  display_name?: string;
  description?: string;
  permissions?: string[];
}

export interface AssignRoleInput {
  user_id: string;
  role_id: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

// Permission check types
export interface PermissionCheck {
  module: string;
  resource: string;
  action: string;
}

export interface UserPermissions {
  modules: {
    [moduleName: string]: {
      [resource: string]: string[]; // actions
    };
  };
}

// Pagination and filtering
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserFilterParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  user_type_id?: string;
  has_employee_id?: boolean;
  role_id?: string;
}

export interface RoleFilterParams extends PaginationParams {
  search?: string;
  module_id?: string;
  is_system?: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Helper types
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'list' | 'approve' | 'reject';
export type ModuleName = 'user_management' | 'hr' | 'inventory' | 'pos' | 'finance';