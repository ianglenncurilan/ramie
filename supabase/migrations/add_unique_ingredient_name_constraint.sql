-- Add UNIQUE constraint to ingredient_name column in inventory table
-- This prevents duplicate ingredient entries

-- Step 1: Create a backup of existing data (optional but recommended)
CREATE TABLE IF NOT EXISTS inventory_backup AS SELECT * FROM inventory;

-- Step 2: Find and merge duplicates using a simpler approach
UPDATE inventory i1
SET quantity = (
  SELECT SUM(i2.quantity) 
  FROM inventory i2 
  WHERE LOWER(TRIM(i2.name)) = LOWER(TRIM(i1.name))
),
cost = (
  SELECT AVG(i2.cost) 
  FROM inventory i2 
  WHERE LOWER(TRIM(i2.name)) = LOWER(TRIM(i1.name))
),
updated_at = NOW()
WHERE i1.id = (
  SELECT MIN(i3.id) 
  FROM inventory i3 
  WHERE LOWER(TRIM(i3.name)) = LOWER(TRIM(i1.name))
);

-- Step 3: Delete duplicates (keep only the first one)
DELETE FROM inventory 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM inventory 
  GROUP BY LOWER(TRIM(name))
);

-- Step 3.5: Clean up any existing generated column from previous attempts
DO $$
BEGIN
  -- Drop the generated column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' 
    AND column_name = 'name_lower'
    AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE inventory DROP COLUMN name_lower;
  END IF;
END $$;

-- Step 4: Add UNIQUE constraint on ingredient_name (case-insensitive)
-- Use a trigger-only approach for case-insensitive uniqueness

-- Create a trigger function for case-insensitive checking
CREATE OR REPLACE FUNCTION check_case_insensitive_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already a row with the same name (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM inventory 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'duplicate ingredient name: %', NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER enforce_unique_ingredient_name
BEFORE INSERT OR UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION check_case_insensitive_name();

-- Step 5: Add index for better performance (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_inventory_name_lower ON inventory (LOWER(TRIM(name)));

-- Step 6: Create a simple upsert function (case-insensitive lookup)
CREATE OR REPLACE FUNCTION upsert_ingredient(
  p_name TEXT,
  p_quantity DECIMAL(10,2),
  p_cost DECIMAL(10,2),
  p_unit TEXT DEFAULT 'kg',
  p_type TEXT DEFAULT 'carbs'
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  quantity DECIMAL(10,2),
  cost DECIMAL(10,2),
  unit TEXT,
  type TEXT,
  is_available BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  action_performed TEXT
) AS $$
BEGIN
  -- Try to update first (case-insensitive lookup)
  UPDATE inventory 
  SET 
    quantity = quantity + p_quantity,
    cost = (cost * quantity + p_cost * p_quantity) / (quantity + p_quantity),
    updated_at = NOW()
  WHERE LOWER(TRIM(name)) = LOWER(TRIM(p_name))
  RETURNING 
    id, name, quantity, cost, unit, type,
    (quantity > 0) as is_available,
    created_at, updated_at,
    'updated'::TEXT as action_performed;
    
  -- If no rows were updated, insert new
  IF NOT FOUND THEN
    INSERT INTO inventory (name, quantity, cost, unit, type, created_at, updated_at)
    VALUES (p_name, p_quantity, p_cost, p_unit, p_type, NOW(), NOW())
    RETURNING 
      id, name, quantity, cost, unit, type,
      (quantity > 0) as is_available,
      created_at, updated_at,
      'inserted'::TEXT as action_performed;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_ingredient TO authenticated;
