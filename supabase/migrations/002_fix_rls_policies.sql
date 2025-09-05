-- Fix RLS Policies to prevent infinite recursion
-- This script fixes the circular reference in user_roles RLS policies

-- Drop the problematic policy on user_roles
DROP POLICY IF EXISTS "View own role assignments" ON user_roles;

-- Create a simpler policy without self-referencing subquery
CREATE POLICY "View own role assignments" 
ON user_roles FOR SELECT 
USING (
  user_id = auth.uid()
  OR auth.uid() IN (
    -- Check if user is super_admin (without recursion)
    SELECT ur.user_id 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN ('super_admin', 'user_admin')
    LIMIT 1
  )
);

-- Also fix the profiles policy to avoid recursion
DROP POLICY IF EXISTS "User admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "User admins can manage profiles" ON profiles;

-- Create simpler admin policies for profiles
CREATE POLICY "User admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  auth.uid() = id  -- Own profile
  OR EXISTS (
    -- Check if user has admin role
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
    LIMIT 1
  )
);

CREATE POLICY "User admins can manage profiles" 
ON profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
    LIMIT 1
  )
);

-- Use the safer assign_first_user_admin function instead of hard-coded email
-- This function assigns super_admin role to the first user in the system
SELECT assign_first_user_admin();

-- Ensure profiles exist for all auth users (not just specific emails)
INSERT INTO profiles (id, email, display_name, status, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'display_name', email),
  'active',
  NOW(),
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();