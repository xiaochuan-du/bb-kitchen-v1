-- Migration 05: Allow all hosts to view all dishes
-- This enables shared dish visibility across all hosts while maintaining
-- ownership control for modifications.

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Hosts can view their own dishes" ON dishes;

-- Create new policy allowing any authenticated user to view all dishes
CREATE POLICY "Hosts can view all dishes" ON dishes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Note: INSERT, UPDATE, DELETE policies remain unchanged
-- Only the dish owner (host_id = auth.uid()) can modify their dishes
