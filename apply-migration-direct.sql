-- Update cost columns from integer to numeric to support decimal values
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;

-- Update the comments to reflect the new column types
COMMENT ON COLUMN care_plan_entries.min_cost IS 'Minimum cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.avg_cost IS 'Average cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.max_cost IS 'Maximum cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.annual_cost IS 'Annual cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.lifetime_cost IS 'Lifetime cost (numeric to support decimal values)';
