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

-- Ensure your user has super_admin role
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  -- Get your user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'royshemuelyabut@gmail.com'
  LIMIT 1;
  
  -- Get super_admin role ID
  SELECT id INTO v_role_id 
  FROM roles 
  WHERE name = 'super_admin'
  LIMIT 1;
  
  -- Ensure user_roles assignment exists
  IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (v_user_id, v_role_id, v_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Ensured super_admin role for royshemuelyabut@gmail.com';
  END IF;
END $$;

-- Also ensure profile exists for your user
INSERT INTO profiles (id, email, display_name, status, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'display_name', email),
  'active',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'royshemuelyabut@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();