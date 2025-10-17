# Admin Access Setup Guide

This guide explains how to set up admin access for users in your Ramie application using Supabase.

## Overview

The application uses Supabase authentication metadata to determine if a user has admin privileges. Admin users can access:
- **Records**: View all feed formulation records
- **Expenses**: Track income and expenses
- **Manage Staff**: Manage staff activities and logs
- **Hogs Tracked**: Monitor all hog tracking data
- **Admin Dashboard**: Central hub for all admin features

## Setting Up Admin Access

### Method 1: Using Supabase Dashboard (Recommended)

1. **Log in to your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Click on "Users"

3. **Find Your User**
   - Locate the user you want to make an admin
   - Click on the user to open their details

4. **Edit User Metadata**
   - Scroll down to the "User Metadata" or "App Metadata" section
   - Click "Edit" or the pencil icon
   - Add one of the following JSON properties:

   **Option A: Using app_metadata (Most Secure)**
   ```json
   {
     "is_admin": true
   }
   ```

   **Option B: Using role field**
   ```json
   {
     "role": "admin"
   }
   ```

   **Option C: Using isAdmin (camelCase)**
   ```json
   {
     "isAdmin": true
   }
   ```

5. **Save Changes**
   - Click "Save" or "Update User"
   - The user will now have admin access

### Method 2: Using Supabase SQL Editor

1. **Open SQL Editor** in your Supabase Dashboard

2. **Run the following SQL command** (replace `user@example.com` with the actual email):

```sql
-- Update user metadata to grant admin access
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'user@example.com';
```

3. **Verify the update**:
```sql
SELECT email, raw_app_meta_data, raw_user_meta_data
FROM auth.users
WHERE email = 'user@example.com';
```

### Method 3: Using Supabase JavaScript Client (For Developers)

If you have admin access to the Supabase Admin API:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // Use service role key, not anon key
)

// Update user to admin
const { data, error } = await supabase.auth.admin.updateUserById(
  'USER_ID',
  {
    app_metadata: { is_admin: true }
  }
)
```

## Verifying Admin Access

After setting up admin access:

1. **Log out** of the application
2. **Log back in** with the admin user account
3. **Check the Profile page** - You should see an "Admin" button
4. **Click the Admin button** - You should be able to access the Admin Dashboard
5. **Check browser console** - You should see logs confirming admin status:
   ```
   isAdmin: Checking admin status for user: admin@example.com
   isAdmin: User is admin (flag found: true)
   ```

## Supported Admin Flag Formats

The application checks for admin status in multiple ways:

### In `app_metadata` (Recommended):
- `is_admin: true`
- `isAdmin: true`
- `role: "admin"`
- `role: "administrator"`

### In `user_metadata` (Alternative):
- `is_admin: true`
- `isAdmin: true`
- `role: "admin"`
- `role: "administrator"`

### Accepted Values:
- Boolean: `true`
- Number: `1`
- String: `"1"`, `"true"`, `"True"`, `"TRUE"`

## Troubleshooting

### Issue: "User is NOT admin" in console

**Solution:**
1. Check that the metadata is set correctly in Supabase Dashboard
2. Verify you're editing `app_metadata` or `user_metadata`, not `raw_user_meta_data`
3. Ensure the JSON format is correct (no syntax errors)
4. Log out and log back in to refresh the session

### Issue: Redirected to Forbidden page

**Solution:**
1. Open browser console (F12)
2. Check for admin status logs
3. If logs show "User is NOT admin", follow the setup steps above
4. Clear browser cache and cookies
5. Try logging out and back in

### Issue: Admin button not showing in Profile

**Solution:**
1. The admin check happens on component mount
2. Refresh the page after logging in
3. Check browser console for any errors
4. Verify the `isAdmin` function is being called

## Security Notes

- **app_metadata** is more secure than **user_metadata** because it can only be modified by Supabase Admin API
- **user_metadata** can be modified by the user themselves in some configurations
- Always use **app_metadata** for production environments
- Never hardcode admin credentials in your application code
- Regularly audit admin users in your Supabase Dashboard

## Admin Features Access

Once admin access is granted, users can:

1. **View Records** - Access all feed formulation records
2. **Manage Expenses** - Add/view income and expenses
3. **Manage Staff** - View and manage staff activities
4. **Track Hogs** - Monitor all hog tracking data
5. **View Statistics** - See quick stats on the admin dashboard

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Ensure your `.env` file has correct Supabase credentials
4. Check that the user is properly authenticated before checking admin status

## Example: Complete Setup Flow

```bash
# 1. User signs up/logs in
# 2. Admin goes to Supabase Dashboard
# 3. Navigate to Authentication > Users
# 4. Find user by email
# 5. Edit user metadata
# 6. Add: { "is_admin": true }
# 7. Save changes
# 8. User logs out and back in
# 9. User can now access Admin Dashboard
```

---

**Last Updated:** October 2025
**Version:** 1.0
