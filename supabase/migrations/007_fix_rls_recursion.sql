-- Fix infinite recursion in user_roles RLS policy
-- The previous policy caused recursion by checking user_roles within a user_roles policy

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "View own role assignments" ON user_roles;

-- Create a simpler policy that avoids recursion
-- Option 1: Allow all authenticated users to view all role assignments (simplest, less secure)
-- Option 2: Allow users to see their own + make a separate admin check

-- Using Option 1 for now to fix the immediate issue
-- This allows all authenticated users to see role assignments
-- Security note: This is less restrictive but avoids the recursion issue
CREATE POLICY "View role assignments"
ON user_roles FOR SELECT
USING (
  -- All authenticated users can view role assignments
  -- This is a temporary fix to avoid recursion
  auth.uid() IS NOT NULL
);

-- Add a comment explaining the policy
COMMENT ON POLICY "View role assignments" ON user_roles IS 
'Allows all authenticated users to view role assignments. This is a simplified policy to avoid infinite recursion issues when checking admin status.';

-- Note: A more secure approach would require restructuring how we check admin status
-- For example, using a separate admin_users table or a database function