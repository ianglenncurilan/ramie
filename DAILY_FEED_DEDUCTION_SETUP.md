# Daily Feed Deduction System - Setup Guide

## Overview

This system automatically processes daily feed consumption for all active hogs, deducts feed from inventory, and updates cost tracking. It includes:

1. **Database-level processing** via PostgreSQL functions
2. **Automated scheduling** using pg_cron
3. **Real-time synchronization** between FeedInventoryView and CostSummaryView
4. **UI feedback** for syncing states

---

## Part 1: Database Setup

### Step 1: Run the Migration Files

Execute these SQL files in your Supabase SQL Editor in order:

1. **`supabase/migrations/daily_feed_deduction_function.sql`**
   - Creates the `hog_daily_consumption` table
   - Creates helper functions for consumption rate and cost calculation
   - Creates the main `process_daily_feed_deduction()` function

2. **`supabase/migrations/setup_pg_cron_daily_deduction.sql`**
   - Sets up the cron job to run daily at midnight

### Step 2: Enable pg_cron Extension

In Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Search for `pg_cron`
3. Click **Enable**

### Step 3: Verify the Setup

Test the function manually:
```sql
SELECT process_daily_feed_deduction();
```

Expected output:
```json
{
  "success": true,
  "date": "2024-01-15",
  "processed_hogs": 5,
  "errors": 0,
  "deductions": {
    "starter": 4.2,
    "grower": 0,
    "finisher": 2.2
  },
  "message": "Processed 5 hogs, deducted 4.2 kg starter, 0 kg grower, 2.2 kg finisher"
}
```

### Step 4: View Scheduled Jobs

Check if the cron job is scheduled:
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-feed-deduction';
```

---

## Part 2: Frontend Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    useFarmData Composable                    │
│  (Shared State Management & Real-time Sync)                  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  FeedInventoryView    │    │   CostSummaryView     │
    │  - Inventory Display  │    │   - Cost Tracking     │
    │  - Stock Levels       │    │   - Daily Costs       │
    └──────────────────────┘    └──────────────────────┘
               │                              │
               └──────────┬───────────────────┘
                          ▼
            ┌─────────────────────┐
            │  Supabase Realtime │
            │  - Auto Updates     │
            │  - Cross-tab Sync   │
            └─────────────────────┘
```

### How It Works

1. **Shared State**: Both views use `useFarmData()` composable
2. **Automatic Sync**: When one view refreshes, the other updates automatically
3. **Real-time Updates**: Supabase Realtime subscriptions listen for database changes
4. **Manual Refresh**: Users can trigger refresh from either view

---

## Part 3: Usage

### Manual Daily Deduction (Testing)

In **CostSummaryView**, click the **🧪 Test** button to manually trigger daily deduction.

### Manual Refresh

In either view, click the **🔄** refresh button to sync all data.

### Syncing Indicator

When data is being synced, you'll see:
- **"Syncing..."** indicator in the header
- Disabled refresh buttons
- Automatic updates when sync completes

---

## Part 4: Data Flow

### Daily Deduction Process

```
1. pg_cron triggers at midnight
   ↓
2. process_daily_feed_deduction() runs
   ↓
3. For each active hog:
   - Calculate consumption based on age
   - Determine feed category (starter/grower/finisher)
   - Calculate cost per kg from inventory
   - Insert into hog_daily_consumption
   - Update hog.total_feed_cost
   ↓
4. Deduct feed from feed_inventory
   ↓
5. Supabase Realtime broadcasts changes
   ↓
6. Frontend views auto-update via subscriptions
```

### Manual Refresh Process

```
User clicks refresh
   ↓
refreshAllData() called
   ↓
Parallel fetch:
   - Feed inventory
   - Hogs data
   - Cost summary
   ↓
Update shared state
   ↓
Dispatch 'farmDataRefreshed' event
   ↓
Both views update automatically
```

---

## Part 5: Troubleshooting

### Issue: Cron job not running

**Solution:**
1. Check if pg_cron is enabled
2. Verify the job exists: `SELECT * FROM cron.job;`
3. Check cron logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Issue: Real-time updates not working

**Solution:**
1. Check Supabase Realtime is enabled in project settings
2. Verify RLS policies allow SELECT on tables
3. Check browser console for subscription errors

### Issue: Daily deduction already processed

**Solution:**
The function prevents duplicate processing for the same day. If you need to re-run:
```sql
-- Delete today's consumption records
DELETE FROM hog_daily_consumption WHERE date = CURRENT_DATE;

-- Re-run the function
SELECT process_daily_feed_deduction();
```

### Issue: Cost calculations incorrect

**Solution:**
1. Verify `feed_inventory` has correct cost data
2. Check `get_feed_cost_per_kg()` function returns correct values
3. Ensure hogs have correct `days` values

---

## Part 6: Customization

### Change Cron Schedule

Edit `setup_pg_cron_daily_deduction.sql`:
```sql
-- Run at 1 AM instead of midnight
SELECT cron.schedule('daily-feed-deduction', '0 1 * * *', $$SELECT process_daily_feed_deduction();$$);
```

### Adjust Consumption Rates

Edit the `get_hog_consumption_rate()` function in `daily_feed_deduction_function.sql`.

### Change Default Feed Prices

Edit the fallback prices in `get_feed_cost_per_kg()` function.

---

## Part 7: Monitoring

### Check Daily Deduction History

```sql
SELECT 
  date,
  COUNT(*) as hogs_processed,
  SUM(amount_kg) as total_kg_consumed,
  SUM(total_cost) as total_cost
FROM hog_daily_consumption
GROUP BY date
ORDER BY date DESC
LIMIT 30;
```

### View Recent Deductions

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-feed-deduction')
ORDER BY start_time DESC
LIMIT 10;
```

---

## Part 8: Security Considerations

1. **RLS Policies**: Ensure proper Row Level Security policies are set
2. **Function Permissions**: Only authenticated users can execute functions
3. **Cron Security**: pg_cron runs with database owner privileges (secure your database)

---

## Part 9: Testing Checklist

- [ ] Database function executes successfully
- [ ] Cron job is scheduled
- [ ] Manual deduction works from CostSummaryView
- [ ] Refresh button updates both views
- [ ] Syncing indicator appears during refresh
- [ ] Real-time updates work when data changes
- [ ] Cost calculations are accurate
- [ ] Feed inventory deducts correctly
- [ ] Hog costs update properly

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify all migrations have been applied
4. Ensure pg_cron extension is enabled

---

## Architecture Benefits

✅ **Database-level processing**: Ensures accuracy even if app is closed  
✅ **Shared state**: Both views stay synchronized  
✅ **Real-time updates**: Automatic updates via Supabase Realtime  
✅ **User feedback**: Clear syncing indicators  
✅ **Scalable**: Handles any number of hogs efficiently  
✅ **Reliable**: Prevents duplicate processing
