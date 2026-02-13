-- Fix existing hog stages to match feed inventory logic
-- This will update all hogs to have the correct stage based on their age

UPDATE hogs 
SET stage = CASE 
  WHEN days <= 84 THEN 'Starter'
  WHEN days <= 112 THEN 'Grower'
  ELSE 'Finisher'
END,
updated_at = NOW()
WHERE stage IS NULL OR 
      (days <= 84 AND stage != 'Starter') OR
      (days > 84 AND days <= 112 AND stage != 'Grower') OR
      (days > 112 AND stage != 'Finisher');

-- Verify the update
SELECT 
  code, 
  days, 
  stage,
  CASE 
    WHEN days <= 84 THEN 'Should be Starter'
    WHEN days <= 112 THEN 'Should be Grower'
    ELSE 'Should be Finisher'
  END as expected_stage
FROM hogs 
ORDER BY days;
