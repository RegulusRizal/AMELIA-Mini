-- Migration: Fix profiles and user_roles relationship for Supabase queries
-- Date: 2025-09-06
-- Issue: Supabase cannot find relationship between profiles and user_roles tables
-- Solution: Create explicit foreign key constraint to enable nested queries

-- ============================================================================
-- ANALYSIS OF THE ISSUE
-- ============================================================================
-- The error "Could not find a relationship between 'profiles' and 'user_roles'"
-- occurs because while both tables reference auth.users, there's no direct
-- foreign key between them. Supabase's query builder needs this explicit
-- relationship to perform nested selections.

-- Current structure:
-- profiles.id -> auth.users.id (PRIMARY KEY, FK)
-- user_roles.user_id -> auth.users.id (FK)
-- Missing: Direct relationship between profiles and user_roles

-- ============================================================================
-- FIX: Add foreign key constraint
-- ============================================================================

-- Since profiles.id is essentially the same as auth.users.id (1:1 relationship),
-- and user_roles.user_id references auth.users.id, we can safely add a
-- foreign key from user_roles.user_id to profiles.id

-- First, check if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_user_roles_profiles'
  ) THEN
    -- Add foreign key constraint from user_roles to profiles
    ALTER TABLE user_roles 
    ADD CONSTRAINT fk_user_roles_profiles 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint fk_user_roles_profiles created successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint fk_user_roles_profiles already exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the constraint was created
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table
FROM pg_constraint 
WHERE conname = 'fk_user_roles_profiles';

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration enables Supabase to understand the relationship between
-- profiles and user_roles, allowing queries like:
--
-- supabase.from('profiles').select(`
--   *,
--   user_roles(
--     role_id,
--     role:roles(id, name, display_name)
--   )
-- `)
--
-- The constraint maintains referential integrity and cascades deletes
-- from profiles to user_roles, which is the desired behavior.
