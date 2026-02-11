-- Simple function to automatically set admin role for a user
-- This gets the UID and sets admin role in raw_app_meta_data automatically
CREATE OR REPLACE FUNCTION set_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Direct SQL update as requested
  UPDATE auth.users 
  SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}' 
  WHERE id = user_uuid;
  
  -- Check if update was successful
  IF FOUND THEN
    result := 'SUCCESS: Admin role automatically set for user ' || user_uuid;
    
    -- Log the action
    RAISE LOG 'Admin role automatically set for user %', user_uuid;
  ELSE
    result := 'ERROR: User not found for UUID ' || user_uuid;
  END IF;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION set_admin_role TO authenticated;
GRANT EXECUTE ON FUNCTION set_admin_role TO service_role;

-- Alternative approach: Create a view to check current admin roles
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  id,
  email,
  raw_app_meta_data,
  raw_app_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'admin';

-- Grant view permissions
GRANT SELECT ON admin_users TO authenticated;
