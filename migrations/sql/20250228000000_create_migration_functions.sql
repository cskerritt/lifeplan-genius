-- Create RPC function for applying migrations
CREATE OR REPLACE FUNCTION apply_migration(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Create RPC function for getting column types
CREATE OR REPLACE FUNCTION get_column_types(table_name text, column_names text[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'column_name', column_name,
    'data_type', data_type
  ))
  INTO result
  FROM information_schema.columns
  WHERE table_name = $1
  AND column_name = ANY($2);
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION apply_migration TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_column_types TO authenticated, anon, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION apply_migration IS 'Executes SQL migrations with error handling';
COMMENT ON FUNCTION get_column_types IS 'Gets data types for specified columns in a table'; 