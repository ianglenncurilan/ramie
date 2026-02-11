-- Function to automatically set user role in auth.users raw_app_meta_data
-- This function writes the admin role directly to the JSON metadata
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, role TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_meta JSONB;
  updated_meta JSONB;
  result TEXT;
BEGIN
  -- Get current metadata or create empty object
  SELECT raw_app_meta_data INTO current_meta
  FROM auth.users 
  WHERE id = user_id;
  
  -- If no metadata exists, create empty object
  IF current_meta IS NULL THEN
    current_meta := '{}';
  END IF;
  
  -- Update metadata with role
  updated_meta := current_meta || jsonb_build_object('role', role);
  
  -- Update the auth.users table
  UPDATE auth.users 
  SET raw_app_meta_data = updated_meta
  WHERE id = user_id;
  
  -- Check if update was successful
  IF FOUND THEN
    result := 'SUCCESS: Role ' || role || ' automatically set in raw_app_meta_data for user ' || user_id;
    
    -- Also log the action for debugging
    RAISE LOG 'Admin role automatically set for user %: %', user_id, updated_meta;
  ELSE
    result := 'ERROR: User not found or update failed for user ' || user_id;
  END IF;
  
  RETURN result;
END;
$$;

-- Grant necessary permissions for both authenticated users and service role
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO service_role;

-- Create a trigger to automatically set admin role when is_admin is updated in public.users
CREATE OR REPLACE FUNCTION sync_admin_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When is_admin changes in public.users, update auth.users
  IF TG_OP = 'UPDATE' AND (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
    PERFORM update_user_role(NEW.id, CASE WHEN NEW.is_admin THEN 'admin' ELSE 'user' END);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync admin role
DROP TRIGGER IF EXISTS sync_admin_role_trigger ON users;
CREATE TRIGGER sync_admin_role_trigger
  AFTER UPDATE OF is_admin ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_role_to_auth();

-- Grant permissions for the trigger function
GRANT EXECUTE ON FUNCTION sync_admin_role_to_auth TO service_role;
