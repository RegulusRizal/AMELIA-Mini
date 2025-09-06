-- Fix for user_roles RLS policy bug
-- The previous policy with LIMIT 1 only allowed the first admin to see all user_roles
-- This corrected policy properly checks if the current user is an admin

-- Drop the buggy policy
DROP POLICY IF EXISTS "View own role assignments" ON user_roles;

-- Create corrected policy using EXISTS
CREATE POLICY "View own role assignments" 
ON user_roles FOR SELECT 
USING (
  -- Users can see their own roles
  user_id = auth.uid()
  -- Admins can see all roles
  OR EXISTS (
    SELECT 1 
    FROM user_roles ur2
    INNER JOIN roles r ON ur2.role_id = r.id
    WHERE ur2.user_id = auth.uid()  -- Check THIS user's roles
    AND r.name IN ('super_admin', 'user_admin')
  )
);

-- Add comment explaining the fix
COMMENT ON POLICY "View own role assignments" ON user_roles IS 
'Allows users to view their own role assignments, and admins to view all role assignments. Fixed to use EXISTS clause instead of IN with LIMIT 1.';