-- Add isManualCost, notes, and rationale fields to care_plan_entries table
ALTER TABLE care_plan_entries ADD COLUMN IF NOT EXISTS is_manual_cost BOOLEAN DEFAULT FALSE;
ALTER TABLE care_plan_entries ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE care_plan_entries ADD COLUMN IF NOT EXISTS rationale TEXT;
