-- Add mfr_min, mfr_max, pfr_min, pfr_max columns to care_plan_entries table
ALTER TABLE care_plan_entries
ADD COLUMN mfr_min numeric(10,4),
ADD COLUMN mfr_max numeric(10,4),
ADD COLUMN pfr_min numeric(10,4),
ADD COLUMN pfr_max numeric(10,4);

-- Add comments to explain the purpose of these columns
COMMENT ON COLUMN care_plan_entries.mfr_min IS 'Minimum Medicare Fee Schedule rate';
COMMENT ON COLUMN care_plan_entries.mfr_max IS 'Maximum Medicare Fee Schedule rate';
COMMENT ON COLUMN care_plan_entries.pfr_min IS 'Minimum Private Fee Schedule rate';
COMMENT ON COLUMN care_plan_entries.pfr_max IS 'Maximum Private Fee Schedule rate'; 