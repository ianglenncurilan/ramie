-- Simplified Feed Calculator - Feed Inventory Integration Fix
-- This script fixes the missing view and ensures basic cost tracking works

-- Add total_cost column to feed_inventory if it doesn't exist
ALTER TABLE feed_inventory 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_formulation_id BIGINT,
ADD COLUMN IF NOT EXISTS last_formulation_date TIMESTAMP WITH TIME ZONE;

-- Create a simplified function to update feed inventory when formulation is saved
CREATE OR REPLACE FUNCTION update_feed_inventory_from_formulation()
RETURNS TRIGGER AS $$
DECLARE
  category TEXT;
  current_stock DECIMAL;
  new_stock DECIMAL;
  current_total_cost DECIMAL;
  new_total_cost DECIMAL;
BEGIN
  -- Map feed type to inventory category
  category := LOWER(NEW.feed_type);
  
  -- Get current inventory values
  SELECT 
    CASE category
      WHEN 'starter' THEN starter_stock
      WHEN 'grower' THEN grower_stock
      WHEN 'finisher' THEN finisher_stock
      ELSE 0
    END,
    COALESCE(total_cost, 0) -- Get the current total_cost from feed_inventory
  INTO current_stock, current_total_cost
  FROM feed_inventory
  WHERE id = 1;
  
  -- Calculate new values
  new_stock := COALESCE(current_stock, 0) + NEW.total_kg;
  new_total_cost := COALESCE(current_total_cost, 0) + NEW.total_cost; -- Add formulation's total_cost to inventory's total_cost
  
  -- Update feed inventory with both stock and the single total_cost from formulation
  UPDATE feed_inventory SET
    starter_stock = CASE WHEN category = 'starter' THEN new_stock ELSE starter_stock END,
    grower_stock = CASE WHEN category = 'grower' THEN new_stock ELSE grower_stock END,
    finisher_stock = CASE WHEN category = 'finisher' THEN new_stock ELSE finisher_stock END,
    total_cost = new_total_cost, -- Update the single total_cost column
    last_formulation_id = NEW.id,
    last_formulation_date = NEW.created_at,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_feed_inventory_from_formulation ON feed_formulations;

-- Create trigger to automatically update inventory when formulation is saved
CREATE TRIGGER trigger_update_feed_inventory_from_formulation
  AFTER INSERT ON feed_formulations
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_inventory_from_formulation();

-- Create a simplified function for cost summary
CREATE OR REPLACE FUNCTION get_feed_cost_summary()
RETURNS TABLE (
  total_feed_investment DECIMAL,
  average_cost_per_kg DECIMAL,
  total_batches BIGINT,
  starter_stock DECIMAL,
  grower_stock DECIMAL,
  finisher_stock DECIMAL,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fi.total_cost, 0) as total_feed_investment,
    CASE WHEN (fi.starter_stock + fi.grower_stock + fi.finisher_stock) > 0 
      THEN COALESCE(fi.total_cost, 0) / NULLIF(fi.starter_stock + fi.grower_stock + fi.finisher_stock, 0) 
      ELSE 0 END as average_cost_per_kg,
    COALESCE((SELECT COUNT(*) FROM feed_formulations), 0) as total_batches,
    COALESCE(fi.starter_stock, 0) as starter_stock,
    COALESCE(fi.grower_stock, 0) as grower_stock,
    COALESCE(fi.finisher_stock, 0) as finisher_stock,
    COALESCE(fi.total_cost, 0) as total_cost
  FROM feed_inventory fi
  WHERE fi.id = 1;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION get_feed_cost_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_feed_cost_summary() TO anon;

-- Update existing inventory records with cost data from formulations
UPDATE feed_inventory SET
  total_cost = COALESCE((
    SELECT COALESCE(SUM(total_cost), 0) 
    FROM feed_formulations 
  ), 0),
  last_formulation_date = (
    SELECT MAX(created_at) 
    FROM feed_formulations
  ),
  updated_at = NOW()
WHERE id = 1;

-- Add comment for documentation
COMMENT ON FUNCTION update_feed_inventory_from_formulation() IS 'Automatically updates feed inventory when new formulations are created';
COMMENT ON FUNCTION get_feed_cost_summary() IS 'Returns cost summary for dashboard display';
