-- Enhanced Feed Calculator - Feed Inventory Integration
-- This script ensures proper cost tracking and inventory updates when feeds are made

-- First, let's add cost tracking columns to feed_inventory if they don't exist
ALTER TABLE feed_inventory 
ADD COLUMN IF NOT EXISTS total_starter_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_grower_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_finisher_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_formulation_id BIGINT,
ADD COLUMN IF NOT EXISTS last_formulation_date TIMESTAMP WITH TIME ZONE;

-- Create a function to update feed inventory when formulation is saved
CREATE OR REPLACE FUNCTION update_feed_inventory_from_formulation()
RETURNS TRIGGER AS $$
DECLARE
  category TEXT;
  current_stock DECIMAL;
  new_stock DECIMAL;
  current_cost DECIMAL;
  new_cost DECIMAL;
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
    CASE category
      WHEN 'starter' THEN COALESCE(total_starter_cost, 0)
      WHEN 'grower' THEN COALESCE(total_grower_cost, 0)
      WHEN 'finisher' THEN COALESCE(total_finisher_cost, 0)
      ELSE 0
    END
  INTO current_stock, current_cost
  FROM feed_inventory
  WHERE id = 1;
  
  -- Calculate new values
  new_stock := current_stock + NEW.total_kg;
  new_cost := current_cost + NEW.total_cost;
  
  -- Update feed inventory
  UPDATE feed_inventory SET
    starter_stock = CASE WHEN category = 'starter' THEN new_stock ELSE starter_stock END,
    grower_stock = CASE WHEN category = 'grower' THEN new_stock ELSE grower_stock END,
    finisher_stock = CASE WHEN category = 'finisher' THEN new_stock ELSE finisher_stock END,
    total_starter_cost = CASE WHEN category = 'starter' THEN new_cost ELSE total_starter_cost END,
    total_grower_cost = CASE WHEN category = 'grower' THEN new_cost ELSE total_grower_cost END,
    total_finisher_cost = CASE WHEN category = 'finisher' THEN new_cost ELSE total_finisher_cost END,
    last_formulation_id = NEW.id,
    last_formulation_date = NEW.created_at,
    updated_at = NOW()
  WHERE id = 1;
  
  -- Log the inventory update for tracking
  INSERT INTO feed_inventory_logs (
    formulation_id, 
    feed_type, 
    amount_added, 
    cost_added, 
    previous_stock, 
    new_stock,
    created_by
  ) VALUES (
    NEW.id,
    NEW.feed_type,
    NEW.total_kg,
    NEW.total_cost,
    current_stock,
    new_stock,
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create feed_inventory_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS feed_inventory_logs (
  id BIGSERIAL PRIMARY KEY,
  formulation_id BIGINT REFERENCES feed_formulations(id),
  feed_type TEXT NOT NULL,
  amount_added DECIMAL(10,2) NOT NULL,
  cost_added DECIMAL(12,2) NOT NULL,
  previous_stock DECIMAL(10,2) NOT NULL,
  new_stock DECIMAL(10,2) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update inventory when formulation is saved
DROP TRIGGER IF EXISTS trigger_update_feed_inventory_from_formulation ON feed_formulations;
CREATE TRIGGER trigger_update_feed_inventory_from_formulation
  AFTER INSERT ON feed_formulations
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_inventory_from_formulation();

-- Create a view for feed inventory with cost analysis
CREATE OR REPLACE VIEW feed_inventory_with_costs AS
SELECT 
  id,
  starter_stock,
  grower_stock,
  finisher_stock,
  total_starter_cost,
  total_grower_cost,
  total_finisher_cost,
  -- Calculate cost per kg for each category
  CASE WHEN starter_stock > 0 THEN total_starter_cost / starter_stock ELSE 0 END as starter_cost_per_kg,
  CASE WHEN grower_stock > 0 THEN total_grower_cost / grower_stock ELSE 0 END as grower_cost_per_kg,
  CASE WHEN finisher_stock > 0 THEN total_finisher_cost / finisher_stock ELSE 0 END as finisher_cost_per_kg,
  -- Total values
  (starter_stock + grower_stock + finisher_stock) as total_stock,
  (total_starter_cost + total_grower_cost + total_finisher_cost) as total_cost,
  CASE WHEN (starter_stock + grower_stock + finisher_stock) > 0 
    THEN (total_starter_cost + total_grower_cost + total_finisher_cost) / (starter_stock + grower_stock + finisher_stock) 
    ELSE 0 END as average_cost_per_kg,
  last_formulation_id,
  last_formulation_date,
  updated_at,
  created_at
FROM feed_inventory;

-- Create a function to get feed inventory summary with cost breakdown
CREATE OR REPLACE FUNCTION get_feed_inventory_summary()
RETURNS TABLE (
  category TEXT,
  stock_kg DECIMAL,
  total_cost DECIMAL,
  cost_per_kg DECIMAL,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'starter' as category,
    starter_stock as stock_kg,
    COALESCE(total_starter_cost, 0) as total_cost,
    CASE WHEN starter_stock > 0 THEN COALESCE(total_starter_cost, 0) / starter_stock ELSE 0 END as cost_per_kg,
    updated_at as last_updated
  FROM feed_inventory
  WHERE id = 1
  
  UNION ALL
  
  SELECT 
    'grower' as category,
    grower_stock as stock_kg,
    COALESCE(total_grower_cost, 0) as total_cost,
    CASE WHEN grower_stock > 0 THEN COALESCE(total_grower_cost, 0) / grower_stock ELSE 0 END as cost_per_kg,
    updated_at as last_updated
  FROM feed_inventory
  WHERE id = 1
  
  UNION ALL
  
  SELECT 
    'finisher' as category,
    finisher_stock as stock_kg,
    COALESCE(total_finisher_cost, 0) as total_cost,
    CASE WHEN finisher_stock > 0 THEN COALESCE(total_finisher_cost, 0) / finisher_stock ELSE 0 END as cost_per_kg,
    updated_at as last_updated
  FROM feed_inventory
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for the new table and view
ALTER TABLE feed_inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feed inventory logs" ON feed_inventory_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert feed inventory logs" ON feed_inventory_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

GRANT ALL ON feed_inventory_logs TO authenticated;
GRANT SELECT ON feed_inventory_logs TO anon;

GRANT SELECT ON feed_inventory_with_costs TO authenticated;
GRANT SELECT ON feed_inventory_with_costs TO anon;

GRANT EXECUTE ON FUNCTION get_feed_inventory_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_feed_inventory_summary() TO anon;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feed_inventory_logs_formulation_id ON feed_inventory_logs(formulation_id);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_logs_feed_type ON feed_inventory_logs(feed_type);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_logs_created_at ON feed_inventory_logs(created_at);

-- Update existing inventory records with cost data from formulations
UPDATE feed_inventory SET
  total_starter_cost = (
    SELECT COALESCE(SUM(total_cost), 0) 
    FROM feed_formulations 
    WHERE feed_type = 'Starter'
  ),
  total_grower_cost = (
    SELECT COALESCE(SUM(total_cost), 0) 
    FROM feed_formulations 
    WHERE feed_type = 'Grower'
  ),
  total_finisher_cost = (
    SELECT COALESCE(SUM(total_cost), 0) 
    FROM feed_formulations 
    WHERE feed_type = 'Finisher'
  ),
  last_formulation_date = (
    SELECT MAX(created_at) 
    FROM feed_formulations
  ),
  updated_at = NOW()
WHERE id = 1;

-- Create a summary function for dashboard
CREATE OR REPLACE FUNCTION get_feed_cost_summary()
RETURNS TABLE (
  total_feed_investment DECIMAL,
  average_cost_per_kg DECIMAL,
  total_batches BIGINT,
  starter_cost DECIMAL,
  grower_cost DECIMAL,
  finisher_cost DECIMAL,
  starter_stock DECIMAL,
  grower_stock DECIMAL,
  finisher_stock DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fi.total_starter_cost + fi.total_grower_cost + fi.total_finisher_cost, 0) as total_feed_investment,
    CASE WHEN (fi.starter_stock + fi.grower_stock + fi.finisher_stock) > 0 
      THEN COALESCE(fi.total_starter_cost + fi.total_grower_cost + fi.total_finisher_cost, 0) / 
           (fi.starter_stock + fi.grower_stock + fi.finisher_stock) 
      ELSE 0 END as average_cost_per_kg,
    COALESCE((SELECT COUNT(*) FROM feed_formulations), 0) as total_batches,
    COALESCE(fi.total_starter_cost, 0) as starter_cost,
    COALESCE(fi.total_grower_cost, 0) as grower_cost,
    COALESCE(fi.total_finisher_cost, 0) as finisher_cost,
    COALESCE(fi.starter_stock, 0) as starter_stock,
    COALESCE(fi.grower_stock, 0) as grower_stock,
    COALESCE(fi.finisher_stock, 0) as finisher_stock
  FROM feed_inventory fi
  WHERE fi.id = 1;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_feed_cost_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_feed_cost_summary() TO anon;

COMMENT ON TABLE feed_inventory_logs IS 'Tracks all inventory changes from feed formulations for audit and analysis';
COMMENT ON VIEW feed_inventory_with_costs IS 'Feed inventory with calculated cost per kg for each category';
COMMENT ON FUNCTION update_feed_inventory_from_formulation() IS 'Automatically updates feed inventory when new formulations are created';
COMMENT ON FUNCTION get_feed_inventory_summary() IS 'Returns detailed summary of feed inventory by category with costs';
COMMENT ON FUNCTION get_feed_cost_summary() IS 'Returns cost summary for dashboard display';
