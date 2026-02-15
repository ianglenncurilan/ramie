-- Daily Feed Deduction Function
-- This function processes daily feed consumption for all active hogs
-- It deducts feed from inventory and updates hog cost tracking

-- First, ensure we have the necessary tables and columns
-- Add hog_daily_consumption table if it doesn't exist
CREATE TABLE IF NOT EXISTS hog_daily_consumption (
  id BIGSERIAL PRIMARY KEY,
  hog_id BIGINT NOT NULL REFERENCES hogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  feed_category TEXT NOT NULL CHECK (feed_category IN ('starter', 'grower', 'finisher')),
  amount_kg DECIMAL(8,3) NOT NULL CHECK (amount_kg > 0),
  unit_cost_per_kg DECIMAL(10,2) NOT NULL CHECK (unit_cost_per_kg >= 0),
  total_cost DECIMAL(10,2) NOT NULL CHECK (total_cost >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hog_id, date, feed_category)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hog_daily_consumption_hog_id ON hog_daily_consumption(hog_id);
CREATE INDEX IF NOT EXISTS idx_hog_daily_consumption_date ON hog_daily_consumption(date);
CREATE INDEX IF NOT EXISTS idx_hog_daily_consumption_category ON hog_daily_consumption(feed_category);

-- Function to get consumption rate based on hog age
CREATE OR REPLACE FUNCTION get_hog_consumption_rate(age_days INTEGER)
RETURNS TABLE (
  daily_kg DECIMAL,
  category TEXT
) AS $consumption_rate$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN age_days <= 28 THEN 0.35::DECIMAL
      WHEN age_days <= 42 THEN 0.75::DECIMAL
      WHEN age_days <= 56 THEN 1.0::DECIMAL
      WHEN age_days <= 70 THEN 1.2::DECIMAL
      WHEN age_days <= 84 THEN 1.4::DECIMAL
      WHEN age_days <= 90 THEN 1.45::DECIMAL
      WHEN age_days <= 98 THEN 1.5::DECIMAL
      WHEN age_days <= 112 THEN 1.7::DECIMAL
      WHEN age_days <= 120 THEN 2.0::DECIMAL
      WHEN age_days <= 126 THEN 2.1::DECIMAL
      WHEN age_days <= 140 THEN 2.2::DECIMAL
      WHEN age_days <= 154 THEN 2.4::DECIMAL
      ELSE 2.65::DECIMAL
    END as daily_kg,
    CASE
      WHEN age_days <= 84 THEN 'starter'::TEXT
      WHEN age_days <= 112 THEN 'grower'::TEXT
      ELSE 'finisher'::TEXT
    END as category;
END;
$consumption_rate$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate cost per kg for a feed category
CREATE OR REPLACE FUNCTION get_feed_cost_per_kg(category_name TEXT)
RETURNS DECIMAL AS $cost_per_kg$
DECLARE
  total_cost DECIMAL;
  total_stock DECIMAL;
  cost_per_kg DECIMAL;
BEGIN
  -- Get total cost and stock for the category from feed_inventory
  SELECT 
    CASE category_name
      WHEN 'starter' THEN COALESCE(total_starter_cost, 0)
      WHEN 'grower' THEN COALESCE(total_grower_cost, 0)
      WHEN 'finisher' THEN COALESCE(total_finisher_cost, 0)
      ELSE 0
    END,
    CASE category_name
      WHEN 'starter' THEN COALESCE(starter_stock, 0)
      WHEN 'grower' THEN COALESCE(grower_stock, 0)
      WHEN 'finisher' THEN COALESCE(finisher_stock, 0)
      ELSE 0
    END
  INTO total_cost, total_stock
  FROM feed_inventory
  WHERE id = 1;

  -- Calculate cost per kg
  IF total_stock > 0 THEN
    cost_per_kg := total_cost / total_stock;
  ELSE
    -- Fallback to default prices if no stock
    cost_per_kg := CASE category_name
      WHEN 'starter' THEN 25.50
      WHEN 'grower' THEN 22.75
      WHEN 'finisher' THEN 20.25
      ELSE 0
    END;
  END IF;

  RETURN COALESCE(cost_per_kg, 0);
END;
$cost_per_kg$ LANGUAGE plpgsql;

-- Main function: Process daily feed deduction for all active hogs
CREATE OR REPLACE FUNCTION process_daily_feed_deduction()
RETURNS JSONB AS $daily_deduction$
DECLARE
  hog_record RECORD;
  consumption_data RECORD;
  daily_kg DECIMAL;
  feed_category TEXT;
  cost_per_kg DECIMAL;
  daily_cost DECIMAL;
  deduction_date DATE;
  total_deductions JSONB := '{}'::JSONB;
  category_deductions JSONB := '{"starter": 0, "grower": 0, "finisher": 0}'::JSONB;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Use today's date
  deduction_date := CURRENT_DATE;

  -- Check if deduction already processed today
  IF EXISTS (
    SELECT 1 FROM hog_daily_consumption 
    WHERE date = deduction_date 
    LIMIT 1
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Daily deduction already processed for today',
      'date', deduction_date
    );
  END IF;

  -- Loop through all active hogs
  FOR hog_record IN 
    SELECT 
      id,
      code,
      days,
      status,
      stage
    FROM hogs
    WHERE status = 'active' OR status IS NULL
  LOOP
    BEGIN
      -- Get consumption rate for this hog
      SELECT * INTO consumption_data
      FROM get_hog_consumption_rate(hog_record.days);

      daily_kg := consumption_data.daily_kg;
      feed_category := consumption_data.category;

      -- Get cost per kg for this feed category
      cost_per_kg := get_feed_cost_per_kg(feed_category);
      daily_cost := daily_kg * cost_per_kg;

      -- Insert daily consumption record
      INSERT INTO hog_daily_consumption (
        hog_id,
        date,
        feed_category,
        amount_kg,
        unit_cost_per_kg,
        total_cost
      ) VALUES (
        hog_record.id,
        deduction_date,
        feed_category,
        daily_kg,
        cost_per_kg,
        daily_cost
      )
      ON CONFLICT (hog_id, date, feed_category) 
      DO UPDATE SET
        amount_kg = EXCLUDED.amount_kg,
        unit_cost_per_kg = EXCLUDED.unit_cost_per_kg,
        total_cost = EXCLUDED.total_cost;

      -- Update hog's total_feed_cost
      UPDATE hogs
      SET total_feed_cost = COALESCE(total_feed_cost, 0) + daily_cost
      WHERE id = hog_record.id;

      -- Accumulate deductions by category
      category_deductions := jsonb_set(
        category_deductions,
        ARRAY[feed_category],
        (category_deductions->>feed_category)::DECIMAL + daily_kg
      );

      processed_count := processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Error processing hog %: %', hog_record.id, SQLERRM;
    END;
  END LOOP;

  -- Deduct feed from inventory
  UPDATE feed_inventory
  SET 
    starter_stock = GREATEST(0, starter_stock - COALESCE((category_deductions->>'starter')::DECIMAL, 0)),
    grower_stock = GREATEST(0, grower_stock - COALESCE((category_deductions->>'grower')::DECIMAL, 0)),
    finisher_stock = GREATEST(0, finisher_stock - COALESCE((category_deductions->>'finisher')::DECIMAL, 0)),
    updated_at = NOW()
  WHERE id = 1;

  -- Return summary
  total_deductions := jsonb_build_object(
    'success', true,
    'date', deduction_date,
    'processed_hogs', processed_count,
    'errors', error_count,
    'deductions', category_deductions,
    'message', format('Processed %s hogs, deducted %s kg starter, %s kg grower, %s kg finisher',
      processed_count,
      COALESCE((category_deductions->>'starter')::DECIMAL, 0),
      COALESCE((category_deductions->>'grower')::DECIMAL, 0),
      COALESCE((category_deductions->>'finisher')::DECIMAL, 0)
    )
  );

  RETURN total_deductions;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to process daily feed deduction'
  );
END;
$daily_deduction$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_daily_feed_deduction() TO authenticated;
GRANT EXECUTE ON FUNCTION get_hog_consumption_rate(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_feed_cost_per_kg(TEXT) TO authenticated;

-- Add RLS policies for hog_daily_consumption
ALTER TABLE hog_daily_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view daily consumption" ON hog_daily_consumption
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert daily consumption" ON hog_daily_consumption
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON FUNCTION process_daily_feed_deduction() IS 
  'Processes daily feed deduction for all active hogs. Deducts feed from inventory and updates hog cost tracking. Should be called once per day via pg_cron.';

COMMENT ON TABLE hog_daily_consumption IS 
  'Tracks daily feed consumption for each hog with cost breakdown';
