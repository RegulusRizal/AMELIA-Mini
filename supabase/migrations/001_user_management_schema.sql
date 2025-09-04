-- User Management Module Database Schema
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. USER PROFILES (extends auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Basic display information
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Optional link to HR module (can be NULL for non-employees)
  employee_id TEXT UNIQUE,
  
  -- User preferences & settings
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  
  -- Account status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_active_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for employee lookups
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id) WHERE employee_id IS NOT NULL;

-- =====================================================
-- 2. USER TYPES (Employee, Contractor, Customer, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  requires_employee_id BOOLEAN DEFAULT false,
  default_roles UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_type_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type_id UUID REFERENCES user_types(id);

-- =====================================================
-- 3. MODULE REGISTRY (for future modules)
-- =====================================================

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  base_route TEXT,
  is_active BOOLEAN DEFAULT true,
  required_employee BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ROLES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE, -- NULL for global roles
  is_system BOOLEAN DEFAULT false, -- System roles can't be deleted
  priority INT DEFAULT 0, -- For role hierarchy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, module_id)
);

-- =====================================================
-- 5. PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, resource, action)
);

-- =====================================================
-- 6. ROLE-PERMISSION MAPPING
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- =====================================================
-- 7. USER-ROLE ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  PRIMARY KEY (user_id, role_id)
);

-- =====================================================
-- 8. ACTIVITY LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  module TEXT,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Profiles: Users with user_admin role can manage all profiles
CREATE POLICY "User admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
  )
);

CREATE POLICY "User admins can manage profiles" 
ON profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- User Types: Everyone can view, only admins can manage
CREATE POLICY "Anyone can view user types" 
ON user_types FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage user types" 
ON user_types FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'super_admin'
  )
);

-- Modules: Everyone can view active modules
CREATE POLICY "View active modules" 
ON modules FOR SELECT 
USING (is_active = true);

-- Roles: View roles you have or all if admin
CREATE POLICY "View own roles" 
ON roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_id = roles.id
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- User Roles: View own assignments or all if admin
CREATE POLICY "View own role assignments" 
ON user_roles FOR SELECT 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- Activity Logs: View own or all if admin
CREATE POLICY "View own activity" 
ON activity_logs FOR SELECT 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_module TEXT,
  p_resource TEXT,
  p_action TEXT,
  p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN modules m ON p.module_id = m.id
    WHERE ur.user_id = p_user_id
      AND m.name = p_module
      AND p.resource = p_resource
      AND p.action = p_action
      AND m.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a module
CREATE OR REPLACE FUNCTION can_access_module(
  p_module_name TEXT,
  p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  v_requires_employee BOOLEAN;
  v_has_employee_id BOOLEAN;
BEGIN
  -- Check if module requires employee_id
  SELECT required_employee INTO v_requires_employee
  FROM modules WHERE name = p_module_name;
  
  -- Check if user has employee_id
  SELECT employee_id IS NOT NULL INTO v_has_employee_id
  FROM profiles WHERE id = p_user_id;
  
  -- If module requires employee and user doesn't have one, deny
  IF v_requires_employee AND NOT v_has_employee_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has any permission for this module
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN modules m ON p.module_id = m.id
    WHERE ur.user_id = p_user_id
      AND m.name = p_module_name
      AND m.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE(
  module_name TEXT,
  resource TEXT,
  action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.name as module_name,
    p.resource,
    p.action
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  JOIN modules m ON p.module_id = m.id
  WHERE ur.user_id = p_user_id
    AND m.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY m.name, p.resource, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. TRIGGERS
-- =====================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. INITIAL DATA
-- =====================================================

-- Insert default user types
INSERT INTO user_types (name, display_name, requires_employee_id) VALUES
  ('employee', 'Employee', true),
  ('contractor', 'Contractor', false),
  ('customer', 'Customer', false),
  ('vendor', 'Vendor', false),
  ('admin', 'System Administrator', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default modules
INSERT INTO modules (name, display_name, description, base_route, required_employee) VALUES
  ('user_management', 'User Management', 'Manage users, roles, and permissions', '/users', false),
  ('hr', 'Human Resources', 'Employee management and HR processes', '/hr', true),
  ('inventory', 'Inventory', 'Inventory management system', '/inventory', false),
  ('pos', 'Point of Sale', 'Sales and transactions', '/pos', false),
  ('finance', 'Finance', 'Financial management and reporting', '/finance', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, display_name, description, module_id, is_system, priority) VALUES
  ('super_admin', 'Super Administrator', 'Full system access', NULL, true, 100),
  ('user_admin', 'User Administrator', 'Manage users and roles', 
    (SELECT id FROM modules WHERE name = 'user_management'), true, 90),
  ('viewer', 'Viewer', 'Read-only access', NULL, true, 10)
ON CONFLICT (name, module_id) DO NOTHING;

-- Insert permissions for user management module
INSERT INTO permissions (module_id, resource, action, description)
SELECT 
  m.id,
  r.resource,
  a.action,
  r.resource || ' ' || a.action || ' permission'
FROM modules m
CROSS JOIN (VALUES ('users'), ('profiles'), ('roles'), ('permissions')) AS r(resource)
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete'), ('list')) AS a(action)
WHERE m.name = 'user_management'
ON CONFLICT (module_id, resource, action) DO NOTHING;

-- Grant all user management permissions to super_admin and user_admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
JOIN modules m ON p.module_id = m.id
WHERE r.name IN ('super_admin', 'user_admin')
  AND m.name = 'user_management'
ON CONFLICT DO NOTHING;

-- Grant read permissions to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action IN ('read', 'list')
ON CONFLICT DO NOTHING;

-- Create a function to assign default super_admin role to first user
CREATE OR REPLACE FUNCTION assign_first_user_admin()
RETURNS void AS $$
DECLARE
  v_first_user_id UUID;
  v_super_admin_role_id UUID;
BEGIN
  -- Get the first user
  SELECT id INTO v_first_user_id
  FROM auth.users
  ORDER BY created_at
  LIMIT 1;
  
  -- Get super_admin role id
  SELECT id INTO v_super_admin_role_id
  FROM roles
  WHERE name = 'super_admin';
  
  -- Assign role if both exist
  IF v_first_user_id IS NOT NULL AND v_super_admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (v_first_user_id, v_super_admin_role_id, v_first_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to assign first user as super admin
SELECT assign_first_user_admin();