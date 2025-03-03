-- Add use_age_increments and age_increments columns to care_plan_entries table
ALTER TABLE care_plan_entries
ADD COLUMN use_age_increments BOOLEAN DEFAULT FALSE,
ADD COLUMN age_increments TEXT;

-- Update the types.ts file to include the new columns
COMMENT ON TABLE care_plan_entries IS 'Table for storing care plan entries with age increment support';
COMMENT ON COLUMN care_plan_entries.use_age_increments IS 'Flag to indicate if this entry uses age increments';
COMMENT ON COLUMN care_plan_entries.age_increments IS 'JSON string containing age increment data';
