-- Deceased Hog Workflow Function
-- This function handles the complete workflow when a hog is marked as deceased:
-- 1. Updates hog status to 'deceased' and records date_of_death
-- 2. Calculates total accumulated feed cost (already tracked in total_feed_cost)
-- 3. Creates expense entry for livestock loss (Purchase Price + Accumulated Feed Cost)
-- 4. Ensures hog is excluded from future daily consumption calculations (status = 'deceased')
-- All operations are performed in a single transaction for data consistency

CREATE OR REPLACE FUNCTION mark_hog_as_deceased(
  p_hog_id BIGINT,
  p_date_of_death DATE,
  p_cause_of_death TEXT,
  p_death_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $deceased_workflow$
DECLARE
  v_hog_data RECORD;
  v_purchase_price DECIMAL(10,2);
  v_total_feed_cost DECIMAL(10,2);
  v_total_loss DECIMAL(10,2);
  v_hog_code TEXT;
  v_expense_id BIGINT;
  v_result JSONB;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Step 1: Get hog data and validate
  SELECT 
    id,
    code,
    purchase_price,
    total_feed_cost,
    status,
    date_of_death
  INTO v_hog_data
  FROM hogs
  WHERE id = p_hog_id;
  
  -- Validate hog exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Hog not found',
      'hog_id', p_hog_id
    );
  END IF;
  
  -- Validate hog is not already deceased
  IF v_hog_data.status = 'deceased' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Hog is already marked as deceased',
      'hog_id', p_hog_id,
      'date_of_death', v_hog_data.date_of_death
    );
  END IF;
  
  -- Validate hog is not sold
  IF v_hog_data.status = 'sold' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot mark sold hog as deceased',
      'hog_id', p_hog_id
    );
  END IF;
  
  -- Extract values
  v_hog_code := v_hog_data.code;
  v_purchase_price := COALESCE(v_hog_data.purchase_price, 0);
  v_total_feed_cost := COALESCE(v_hog_data.total_feed_cost, 0);
  v_total_loss := v_purchase_price + v_total_feed_cost;
  
  -- Step 2: Update hog status and date_of_death
  UPDATE hogs
  SET 
    status = 'deceased',
    date_of_death = p_date_of_death,
    updated_at = NOW()
  WHERE id = p_hog_id;
  
  -- Step 3: Create death record
  INSERT INTO records (
    hog_id,
    record_type,
    event_date,
    details
  ) VALUES (
    p_hog_id,
    'death',
    p_date_of_death,
    jsonb_build_object(
      'cause_of_death', p_cause_of_death,
      'notes', COALESCE(p_death_notes, ''),
      'purchase_price', v_purchase_price,
      'total_feed_cost', v_total_feed_cost,
      'total_loss', v_total_loss
    )
  );
  
  -- Step 4: Create expense entry for livestock loss
  -- Only create expense if there's a loss (total_loss > 0)
  IF v_total_loss > 0 THEN
    INSERT INTO expenses (
      label,
      amount,
      type,
      date,
      reference_id,
      reference_type,
      notes
    ) VALUES (
      'Livestock Loss - ' || v_hog_code || ' (' || p_cause_of_death || ')',
      v_total_loss,
      'expense',
      p_date_of_death,
      p_hog_id,
      'hog',
      COALESCE(p_death_notes, '') || 
        CASE 
          WHEN p_death_notes IS NOT NULL AND p_death_notes != '' THEN ' | '
          ELSE ''
        END ||
        'Purchase Price: ₱' || v_purchase_price || 
        ', Feed Cost: ₱' || v_total_feed_cost
    )
    RETURNING id INTO v_expense_id;
  END IF;
  
  -- Step 5: Build result object
  v_result := jsonb_build_object(
    'success', true,
    'hog_id', p_hog_id,
    'hog_code', v_hog_code,
    'date_of_death', p_date_of_death,
    'cause_of_death', p_cause_of_death,
    'purchase_price', v_purchase_price,
    'total_feed_cost', v_total_feed_cost,
    'total_loss', v_total_loss,
    'expense_id', v_expense_id,
    'message', format(
      'Hog %s marked as deceased. Total loss: ₱%s (Purchase: ₱%s + Feed: ₱%s)',
      v_hog_code,
      v_total_loss,
      v_purchase_price,
      v_total_feed_cost
    )
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback is automatic on exception
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE,
    'hog_id', p_hog_id,
    'message', 'Failed to mark hog as deceased'
  );
END;
$deceased_workflow$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_hog_as_deceased(BIGINT, DATE, TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION mark_hog_as_deceased(BIGINT, DATE, TEXT, TEXT) IS 
  'Marks a hog as deceased in a single transaction. Updates hog status, records death date, creates death record, and creates expense entry for livestock loss. Ensures data consistency across hogs, records, and expenses tables.';

-- Ensure date_of_death column exists in hogs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hogs' AND column_name = 'date_of_death'
  ) THEN
    ALTER TABLE hogs ADD COLUMN date_of_death DATE;
    COMMENT ON COLUMN hogs.date_of_death IS 'Date when the hog died';
  END IF;
END $$;

-- Ensure deceased_date column exists (alternative name, check both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hogs' AND column_name = 'deceased_date'
  ) THEN
    -- If date_of_death doesn't exist, create deceased_date
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'hogs' AND column_name = 'date_of_death'
    ) THEN
      ALTER TABLE hogs ADD COLUMN deceased_date DATE;
      COMMENT ON COLUMN hogs.deceased_date IS 'Date when the hog died';
    END IF;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_hogs_date_of_death ON hogs(date_of_death) WHERE date_of_death IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hogs_deceased_date ON hogs(deceased_date) WHERE deceased_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hogs_status ON hogs(status);

-- Add trigger to prevent cost modifications after death
CREATE OR REPLACE FUNCTION prevent_cost_modification_after_death()
RETURNS TRIGGER AS $prevent_modification$
BEGIN
  -- If hog is deceased and trying to modify purchase_price or total_feed_cost
  IF OLD.status = 'deceased' AND (
    NEW.purchase_price IS DISTINCT FROM OLD.purchase_price OR
    NEW.total_feed_cost IS DISTINCT FROM OLD.total_feed_cost
  ) THEN
    RAISE EXCEPTION 'Cannot modify purchase_price or total_feed_cost for deceased hogs. Death date: %', OLD.date_of_death;
  END IF;
  
  RETURN NEW;
END;
$prevent_modification$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_deceased_hog_cost_modification ON hogs;
CREATE TRIGGER check_deceased_hog_cost_modification
  BEFORE UPDATE ON hogs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_cost_modification_after_death();

COMMENT ON FUNCTION prevent_cost_modification_after_death() IS 
  'Prevents modification of purchase_price or total_feed_cost for hogs that are already marked as deceased.';
