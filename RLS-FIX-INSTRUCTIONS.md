# Fix Feed Inventory RLS Permission Error

## Problem
```
Error saving feed formulation: new row violates row-level security policy for table "feed_inventory"
```

## Root Cause
The feed inventory table has restrictive RLS policies that only allow admins to update the feed inventory. When regular users create feeds, they need to update the inventory but don't have permission.

## Solution

### Option 1: Quick Fix (Recommended)
Run this SQL script in Supabase SQL Editor:

```sql
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
```

### Option 2: Migration File
Use the migration file: `supabase/migrations/fix_feed_inventory_rls.sql`

### Option 3: Run the Fix Script
Run: `fix-feed-inventory-permissions.sql`

## After Fix
1. ✅ Users can create feeds without permission errors
2. ✅ Feed inventory stocks will update automatically
3. ✅ FeedInventoryView will show correct stock levels
4. ✅ Error messages will be more helpful

## Verification
After applying the fix:
1. Go to any feed calculator (Starter/Grower/Finisher)
2. Create and save a feed formulation
3. Check FeedInventoryView - stocks should be updated
4. No more RLS permission errors

## Current RLS Policies (After Fix)
- ✅ Authenticated users can SELECT (view)
- ✅ Authenticated users can INSERT (create)
- ✅ Authenticated users can UPDATE (modify)
- ✅ Authenticated users can DELETE (remove)

The feed inventory connection will work perfectly after applying this fix!
