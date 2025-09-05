-- Add INSERT policy for activity_logs table
-- This allows authenticated users to insert their own activity logs

-- Drop existing policies if any (to be safe)
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;

-- Create INSERT policy for activity_logs
-- Allow authenticated users to insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Verify RLS is enabled on the table
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;