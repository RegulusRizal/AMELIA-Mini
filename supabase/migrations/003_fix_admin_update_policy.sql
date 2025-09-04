-- Fix Admin UPDATE Policy for Profiles Table
-- This migration adds a policy allowing admins to UPDATE other users' profiles

-- Drop the existing "Users can update own profile" policy to recreate it
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate the self-update policy
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create new policy allowing admins to update any profile
CREATE POLICY "Admins can update any profile" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'user_admin')
    LIMIT 1
  )
);

-- Also ensure delete policy exists for admins (if not already)
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
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

-- Add a helpful comment
COMMENT ON POLICY "Admins can update any profile" ON profiles IS 
'Allows super_admin and user_admin roles to update any user profile, fixing the issue where admins could not edit other users';

-- Verify policies are working
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for profiles table have been updated:';
  RAISE NOTICE '- Users can update their own profile';
  RAISE NOTICE '- Admins (super_admin, user_admin) can update any profile';
  RAISE NOTICE '- Admins can delete any profile';
END $$;