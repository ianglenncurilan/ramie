-- Fix RLS policies for feed_inventory table
-- Allow authenticated users to update feed inventory when creating feeds

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can update feed inventory" ON feed_inventory;

-- Create new policy that allows authenticated users to update feed inventory
CREATE POLICY "Authenticated users can update feed inventory" ON feed_inventory
  FOR ALL USING (auth.role() = 'authenticated');

-- Also ensure users can insert new records
CREATE POLICY "Authenticated users can insert feed inventory" ON feed_inventory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Keep the existing read policy
CREATE POLICY "Users can view feed inventory" ON feed_inventory
  FOR SELECT USING (auth.role() = 'authenticated');
