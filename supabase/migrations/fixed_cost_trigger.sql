-- Fixed Trigger for Cost Flow from feed_formulations to feed_inventory
-- This fixes the NEW.total_cost error by using BEFORE INSERT

-- Step 1: Drop all foreign key constraints that are causing issues
DO $$
BEGIN
    ALTER TABLE feed_formulations DROP CONSTRAINT IF EXISTS feeds_inventor_id_fkey;
    ALTER TABLE feed_formulations DROP CONSTRAINT IF EXISTS feed_formulations_inventory_id_fkey;
    ALTER TABLE feed_formulations DROP CONSTRAINT IF EXISTS feed_formulations_inventory_id_fkey1;
    ALTER TABLE feed_formulations DROP CONSTRAINT IF EXISTS feed_formulations_inventory_id_fkey2;
END $$;

-- Step 2: Remove inventory_id column completely
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feed_formulations' 
        AND column_name = 'inventory_id'
    ) THEN
        ALTER TABLE feed_formulations DROP COLUMN inventory_id;
    END IF;
END $$;

-- Step 3: Add total_cost column to feed_inventory if it doesn't exist
ALTER TABLE feed_inventory 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;

-- Step 4: Create FIXED trigger using BEFORE INSERT (NEW is available here)
CREATE OR REPLACE FUNCTION update_feed_inventory_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the formulation's total_cost to the inventory's total_cost
  UPDATE feed_inventory 
  SET 
    total_cost = COALESCE(total_cost, 0) + NEW.total_cost,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing triggers
DROP TRIGGER IF EXISTS tr_update_feed_cost ON feed_formulations;
DROP TRIGGER IF EXISTS trigger_update_feed_inventory_from_formulation ON feed_formulations;

-- Step 6: Create FIXED trigger using BEFORE INSERT
CREATE TRIGGER tr_update_feed_cost
BEFORE INSERT ON feed_formulations
FOR EACH ROW EXECUTE FUNCTION update_feed_inventory_total_cost();

-- Step 7: Update existing total_cost with sum of all formulations
UPDATE feed_inventory 
SET total_cost = COALESCE((
    SELECT SUM(total_cost) 
    FROM feed_formulations
), 0),
updated_at = NOW()
WHERE id = 1;

-- Step 8: Create simple function to get total cost
CREATE OR REPLACE FUNCTION get_feed_total_cost()
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((
    SELECT total_cost 
    FROM feed_inventory 
    WHERE id = 1
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_feed_total_cost() TO authenticated;
GRANT EXECUTE ON FUNCTION get_feed_total_cost() TO anon;

COMMENT ON FUNCTION update_feed_inventory_total_cost() IS 'Fixed trigger using BEFORE INSERT to access NEW.total_cost';
COMMENT ON FUNCTION get_feed_total_cost() IS 'Returns total cost from feed_inventory';
