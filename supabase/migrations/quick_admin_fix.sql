-- QUICK FIX: Run this in Supabase SQL Editor immediately
-- This will create the function needed for automatic admin role assignment

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS set_admin_role;

-- Create the simple admin role function
CREATE OR REPLACE FUNCTION set_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Update the auth.users table with admin role
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || '{"role": "admin"}' 
  WHERE id = user_uuid;
  
  IF FOUND THEN
    result := 'SUCCESS: Admin role set for ' || user_uuid;
    RAISE LOG 'Admin role automatically set for user %', user_uuid;
  ELSE
    result := 'ERROR: User not found ' || user_uuid;
  END IF;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION set_admin_role TO authenticated;
GRANT EXECUTE ON FUNCTION set_admin_role TO service_role;

-- Test the function (optional)
-- SELECT set_admin_role('test-uuid-here');

-- Check if function was created successfully
SELECT proname, prosrc FROM pg_proc WHERE proname = 'set_admin_role';
