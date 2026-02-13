-- Add stage column to hogs table
-- This will store the calculated hog stage (Starter, Grower, Finisher)

ALTER TABLE hogs 
ADD COLUMN stage TEXT DEFAULT 'Starter';

-- Create index for better performance
CREATE INDEX idx_hogs_stage ON hogs(stage);

-- Update existing hogs with calculated stages (matching feed inventory logic)
UPDATE hogs 
SET stage = CASE 
  WHEN days <= 84 THEN 'Starter'
  WHEN days <= 112 THEN 'Grower'
  ELSE 'Finisher'
END
WHERE stage IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN hogs.stage IS 'Hog growth stage based on age: Starter (0-84 days), Grower (85-112 days), Finisher (113+ days)';
