-- Fix feed inventory RLS permissions
-- Run this script in Supabase SQL Editor to fix the permission issue

-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Admins can update feed inventory" ON feed_inventory;

-- Allow authenticated users to perform all operations on feed inventory
CREATE POLICY "Authenticated users can manage feed inventory" ON feed_inventory
  FOR ALL USING (auth.role() = 'authenticated');

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'feed_inventory';
