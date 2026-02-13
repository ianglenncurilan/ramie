-- Fix feed inventory table and ensure proper connection
-- This script ensures the feed inventory table exists and has proper data

-- Create feed_inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS feed_inventory (
  id BIGINT PRIMARY KEY DEFAULT 1,
  starter_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  grower_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  finisher_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure there's a record with id=1
INSERT INTO feed_inventory (id, starter_stock, grower_stock, finisher_stock)
SELECT 
  1, 
  0.0, -- Start with 0 to test updates
  0.0, -- Start with 0 to test updates  
  0.0  -- Start with 0 to test updates
WHERE NOT EXISTS (SELECT 1 FROM feed_inventory WHERE id = 1);

-- Check current feed formulations to see what should be in inventory
SELECT 
  feed_type,
  name,
  total_kg,
  created_at
FROM feed_formulations 
ORDER BY created_at DESC;

-- Check current inventory levels
SELECT 
  id,
  starter_stock,
  grower_stock,
  finisher_stock,
  updated_at
FROM feed_inventory;
