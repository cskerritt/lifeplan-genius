-- Add mfr_factor and pfr_factor columns to care_plan_entries table
ALTER TABLE care_plan_entries
ADD COLUMN mfr_factor numeric(10,4),
ADD COLUMN pfr_factor numeric(10,4);

-- Add comments to explain the purpose of these columns
COMMENT ON COLUMN care_plan_entries.mfr_factor IS 'Medicare Fee Schedule geographic adjustment factor';
COMMENT ON COLUMN care_plan_entries.pfr_factor IS 'Private Fee Schedule geographic adjustment factor';
