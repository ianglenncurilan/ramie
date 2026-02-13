-- Create feed_inventory table for intelligent feed management
-- This table tracks the current stock levels of different feed types

CREATE TABLE IF NOT EXISTS feed_inventory (
  id BIGINT PRIMARY KEY DEFAULT 1,
  starter_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  grower_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  finisher_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial record if table is empty
INSERT INTO feed_inventory (id, starter_stock, grower_stock, finisher_stock)
SELECT 
  1, 
  1000.0, -- Initial starter stock
  1500.0, -- Initial grower stock  
  2000.0  -- Initial finisher stock
WHERE NOT EXISTS (SELECT 1 FROM feed_inventory);

-- Add RLS policies
ALTER TABLE feed_inventory ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read feed inventory
CREATE POLICY "Users can view feed inventory" ON feed_inventory
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can update feed inventory
CREATE POLICY "Admins can update feed inventory" ON feed_inventory
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT ALL ON feed_inventory TO authenticated;
GRANT SELECT ON feed_inventory TO anon;
