
-- Function to get column information for a given table
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name TEXT, schema_name TEXT DEFAULT 'public')
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    (c.is_nullable = 'YES')::BOOLEAN
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = schema_name
    AND c.table_name = get_table_columns.table_name;
END;
$$;

-- Grant appropriate privileges
GRANT EXECUTE ON FUNCTION public.get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns TO service_role;
