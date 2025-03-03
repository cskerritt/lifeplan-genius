-- Create a table to track applied migrations
CREATE TABLE IF NOT EXISTS applied_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT,
  success BOOLEAN NOT NULL
);

-- Add comments for documentation
COMMENT ON TABLE applied_migrations IS 'Tracks which migrations have been applied to the database';
COMMENT ON COLUMN applied_migrations.migration_name IS 'Name of the migration file';
COMMENT ON COLUMN applied_migrations.applied_at IS 'Timestamp when the migration was applied';
COMMENT ON COLUMN applied_migrations.applied_by IS 'User or service that applied the migration';
COMMENT ON COLUMN applied_migrations.success IS 'Whether the migration was successfully applied';

-- Create function to record migrations
CREATE OR REPLACE FUNCTION record_migration(
  migration_name TEXT,
  applied_by TEXT DEFAULT current_user,
  success BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO applied_migrations (migration_name, applied_by, success)
  VALUES (migration_name, applied_by, success)
  ON CONFLICT (migration_name) 
  DO UPDATE SET 
    applied_at = NOW(),
    applied_by = EXCLUDED.applied_by,
    success = EXCLUDED.success;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON applied_migrations TO authenticated, anon, service_role;
GRANT USAGE, SELECT ON SEQUENCE applied_migrations_id_seq TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION record_migration TO authenticated, anon, service_role; 