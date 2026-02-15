-- Setup pg_cron for Daily Feed Deduction
-- This script sets up a cron job to run the daily feed deduction every day at midnight

-- Note: pg_cron must be enabled in your Supabase project
-- Enable it in: Supabase Dashboard > Database > Extensions > pg_cron

-- Schedule the daily feed deduction to run at 00:00 (midnight) every day
-- Format: cron expression (minute hour day month weekday)
-- '0 0 * * *' = every day at midnight

SELECT cron.schedule(
  'daily-feed-deduction',           -- Job name
  '0 0 * * *',                      -- Schedule: Every day at midnight
  $$SELECT process_daily_feed_deduction();$$  -- SQL to execute
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('daily-feed-deduction');

-- To manually test the function:
-- SELECT process_daily_feed_deduction();

-- Alternative: Run at 1 AM (if midnight causes issues)
-- SELECT cron.schedule('daily-feed-deduction', '0 1 * * *', $$SELECT process_daily_feed_deduction();$$);
