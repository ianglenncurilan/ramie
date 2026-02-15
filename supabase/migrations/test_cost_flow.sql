-- Test Script to Verify Cost Flow from feed_formulations to feed_inventory
-- Run this to test that total_cost flows correctly

-- Test 1: Check current total_cost in feed_inventory
SELECT 'Current feed_inventory total_cost' as test_info, total_cost FROM feed_inventory WHERE id = 1;

-- Test 2: Check sum of all formulation costs
SELECT 'Sum of all feed_formulations total_cost' as test_info, SUM(total_cost) as formulation_total_cost FROM feed_formulations;

-- Test 3: Simulate inserting a test formulation
INSERT INTO feed_formulations (
  feed_type, name, total_kg, total_cost, cost_per_kg, notes, created_by
) VALUES (
  'Starter', 'Test Feed', 50.0, 750.00, 15.00, 'Test formulation', '00000000-0000-0000-0000-0000-0000-0000'
);

-- Test 4: Check if trigger updated feed_inventory total_cost
SELECT 'After test insertion - feed_inventory total_cost' as test_info, total_cost FROM feed_inventory WHERE id = 1;

-- Test 5: Verify the trigger worked by checking the difference
SELECT 
  'Cost flow verification' as test_info,
  (SELECT total_cost FROM feed_inventory WHERE id = 1) - (SELECT SUM(total_cost) FROM feed_formulations) as difference,
  CASE 
    WHEN (SELECT total_cost FROM feed_inventory WHERE id = 1) = (SELECT SUM(total_cost) FROM feed_formulations) 
    THEN '✅ SUCCESS: Costs match!'
    ELSE '❌ FAILED: Costs do not match!'
  END as result;

-- Test 6: Clean up test data
DELETE FROM feed_formulations WHERE name = 'Test Feed';

-- Test 7: Reset feed_inventory total_cost to original value
UPDATE feed_inventory 
SET total_cost = (SELECT SUM(total_cost) FROM feed_formulations),
updated_at = NOW()
WHERE id = 1;

SELECT 'Test completed - feed_inventory reset to original total_cost' as test_info, total_cost FROM feed_inventory WHERE id = 1;

-- This test verifies that:
-- 1. feed_formulations.total_cost flows to feed_inventory.total_cost
-- 2. Trigger automatically updates the total_cost
-- 3. The values match correctly
