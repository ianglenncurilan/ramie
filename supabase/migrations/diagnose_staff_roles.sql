-- Diagnostic script to check staff roles
-- Run this in Supabase SQL Editor to see what's happening

-- Check all users with their admin status
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.is_admin,
  u.role,
  u.created_at,
  CASE 
    WHEN u.is_admin = true THEN 'SHOULD SHOW: Administrator'
    ELSE 'SHOULD SHOW: Staff'
  END as expected_display
FROM public.users u
ORDER BY u.created_at DESC;

-- Check if there are any NULL is_admin values
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_admin IS NULL THEN 1 END) as null_admin_count,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count,
  COUNT(CASE WHEN is_admin = false THEN 1 END) as staff_count
FROM public.users;

-- Check the most recent user created
SELECT 
  'Most Recent User' as info,
  u.id,
  u.email,
  u.is_admin,
  u.role,
  u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 1;

-- Fix any NULL is_admin values that should be admin based on role
UPDATE public.users 
SET is_admin = true 
WHERE is_admin IS NULL 
  AND role = 'admin';

-- Fix any NULL is_admin values that should be staff based on role  
UPDATE public.users 
SET is_admin = false 
WHERE is_admin IS NULL 
  AND role = 'staff';

-- Show the fix results
SELECT 
  'After Fix' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count,
  COUNT(CASE WHEN is_admin = false THEN 1 END) as staff_count
FROM public.users;
