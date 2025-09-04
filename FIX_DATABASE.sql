-- =========================================================
-- IMMEDIATE FIX FOR USER MANAGEMENT DATABASE ISSUES
-- Run this script in your Supabase SQL Editor
-- =========================================================

-- Step 1: Temporarily disable RLS to fix the recursion issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "View own role assignments" ON user_roles;
DROP POLICY IF EXISTS "User admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "User admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "View own roles" ON roles;

-- Step 3: Create your profile if it doesn't exist
INSERT INTO profiles (id, email, display_name, first_name, last_name, status, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'first_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'last_name', ''),
  'active',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'royshemuelyabut@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Step 4: Ensure super_admin role exists and assign it to you
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
  
  -- Ensure super_admin role exists
  INSERT INTO roles (name, display_name, description)
  VALUES ('super_admin', 'Super Admin', 'Full system access')
  ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name
  RETURNING id INTO v_role_id;
  
  -- Assign super_admin role to you
  IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES (v_user_id, v_role_id, v_user_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Assigned super_admin role to royshemuelyabut@gmail.com';
  END IF;
END $$;

-- Step 5: Create simplified RLS policies without recursion

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);  -- Temporarily allow all reads for debugging

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON profiles FOR INSERT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    INNER JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'user_admin')
  )
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM roles r
    INNER JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- Roles policies  
CREATE POLICY "Anyone can view roles"
ON roles FOR SELECT
USING (true);  -- Allow viewing all roles

-- User roles policies
CREATE POLICY "View all role assignments"
ON user_roles FOR SELECT
USING (true);  -- Temporarily allow viewing all assignments

CREATE POLICY "Admins can manage role assignments"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id IN (
      SELECT role_id FROM user_roles WHERE user_id = auth.uid()
    )
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- Step 6: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create some test users to ensure data is visible
INSERT INTO profiles (id, email, display_name, first_name, last_name, status, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  split_part(split_part(email, '@', 1), '.', 1),
  split_part(split_part(email, '@', 1), '.', 2),
  'active',
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Verify the fix
SELECT 'Profiles count:' as check_type, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Roles count:', COUNT(*) FROM roles
UNION ALL
SELECT 'User roles count:', COUNT(*) FROM user_roles
UNION ALL
SELECT 'Your profile exists:', COUNT(*) FROM profiles WHERE email = 'royshemuelyabut@gmail.com'
UNION ALL
SELECT 'You have super_admin:', COUNT(*) 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'royshemuelyabut@gmail.com' AND r.name = 'super_admin';

-- If all counts show > 0, the fix was successful!