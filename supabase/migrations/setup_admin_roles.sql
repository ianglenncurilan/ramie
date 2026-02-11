-- Comprehensive admin role setup script
-- Run this in Supabase SQL Editor to fix admin role issues

-- First, check current auth.users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth' 
ORDER BY ordinal_position;

-- Check if metadata columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth' 
  AND column_name LIKE '%meta%';

-- Test the update_user_role function
SELECT update_user_role(
  (SELECT id FROM auth.users LIMIT 1)::uuid, 
  'admin'
) as test_result;

-- Check existing admin users
SELECT 
  id, 
  email, 
  raw_app_meta_data,
  raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'admin';

-- Update any existing admin users that might not have proper metadata
UPDATE auth.users 
SET 
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || jsonb_build_object('role', 'admin')
WHERE id IN (
  SELECT u.id 
  FROM public.users u 
  WHERE u.is_admin = true 
    AND u.id = auth.users.id
) 
  AND (raw_app_meta_data->>'role' IS NULL OR raw_app_meta_data->>'role' != 'admin');

-- Verify the updates
SELECT 
  'After Update' as status,
  COUNT(*) as admin_count
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'admin'

UNION ALL

SELECT 
  'Before Update' as status,
  COUNT(*) as admin_count
FROM (
  SELECT id FROM auth.users 
  WHERE raw_app_meta_data->>'role' = 'admin'
  EXCEPT
  SELECT id FROM auth.users 
  WHERE raw_app_meta_data->>'role' = 'admin'
    AND id IN (
      SELECT u.id FROM public.users u WHERE u.is_admin = true
    )
) as missing_admins;
