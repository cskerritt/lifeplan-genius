# Verifying Data Completeness in pgAdmin

This guide will help you confirm that all the necessary data, including GAF lookup and CPT codes, are properly loaded in your database.

## Checking GAF Lookup Data

1. Open pgAdmin and connect to your database.
2. Click on the **Query Tool** button in the toolbar (it looks like a lightning bolt).
3. In the query editor, run the following SQL queries:

```sql
-- Count the total number of records in the gaf_lookup table
SELECT COUNT(*) FROM public.gaf_lookup;
```

You should see a count of records. For the GAF lookup table, you would typically expect to see several thousand records (one for each ZIP code). If you see a very small number (like less than 100), it might indicate that the data is not fully loaded.

```sql
-- Check a sample of records from the gaf_lookup table
SELECT * FROM public.gaf_lookup LIMIT 10;
```

This will show you the first 10 records in the table. Verify that the data looks correct, with fields like:
- zip
- city
- state_name
- mfr_code
- pfr_code

```sql
-- Check for a specific ZIP code
SELECT * FROM public.gaf_lookup WHERE zip = '02917';
```

This should return the record for ZIP code 02917 (Providence, Rhode Island) that was mentioned in the error logs.

## Checking CPT Codes Data

1. In the same query editor or a new one, run the following SQL queries:

```sql
-- Check if the cpt_code table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cpt_code'
) as table_exists;
```

If this returns `true`, then the CPT code table exists. If it returns `false`, the table might be named differently or might not exist.

```sql
-- Try alternative table names if 'cpt_code' doesn't exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%cpt%';
```

This will search for any table with "cpt" in its name.

Once you've identified the correct table name (let's assume it's `cpt_code`), run:

```sql
-- Count the total number of CPT codes
SELECT COUNT(*) FROM public.cpt_code;
```

You should see a count of records. For CPT codes, you would typically expect to see several thousand records.

```sql
-- Check a sample of CPT codes
SELECT * FROM public.cpt_code LIMIT 10;
```

This will show you the first 10 CPT codes. Verify that the data looks correct, with fields like:
- code
- code_description
- mfu_50th
- mfu_75th
- mfu_90th
- pfr_50th
- pfr_75th
- pfr_90th

## Checking All Tables and Record Counts

To get a comprehensive view of all tables and their record counts:

```sql
-- List all tables in the public schema with their record counts
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

Then, to get the row count for each table, you'll need to run individual queries. Here are examples for the key tables:

```sql
-- Count rows in gaf_lookup table
SELECT COUNT(*) FROM public.gaf_lookup;

-- Count rows in life_care_plans table
SELECT COUNT(*) FROM public.life_care_plans;

-- Count rows in care_plan_entries table
SELECT COUNT(*) FROM public.care_plan_entries;
```

If you want to check the size of tables, you can use:

```sql
-- Get table sizes (simpler version that should work in all PostgreSQL versions)
SELECT
  relname AS table_name,
  pg_size_pretty(pg_relation_size(oid)) AS size
FROM
  pg_class
WHERE
  relkind = 'r' AND
  relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY
  pg_relation_size(oid) DESC;
```

This query will show you all tables in the public schema, along with:
- The number of columns in each table
- The size of each table in bytes and in a human-readable format
- The number of rows in each table

Tables with a large number of rows (thousands or more) are likely to be lookup tables like GAF lookup and CPT codes.

## Checking for Missing Data

If you suspect that some data might be missing, you can run queries to check for gaps or inconsistencies:

```sql
-- Check for ZIP codes that might be missing
SELECT COUNT(DISTINCT zip) FROM public.gaf_lookup;
```

This will tell you how many unique ZIP codes are in the GAF lookup table. The US has approximately 42,000 ZIP codes, so if the count is significantly lower, some data might be missing.

```sql
-- Check for states that might be missing
SELECT DISTINCT state_name FROM public.gaf_lookup ORDER BY state_name;
```

This will list all the states in the GAF lookup table. There should be 50 states plus DC and possibly some territories.

## Importing Missing Data

If you find that data is missing, you can import it using pgAdmin's import functionality:

1. Right-click on the table you want to import data into (e.g., `gaf_lookup`).
2. Select **Import/Export** from the context menu.
3. In the dialog that appears:
   - Set **Import/Export** to **Import**.
   - Browse for the CSV file containing the data.
   - Set the appropriate options for the file format.
   - Click **OK** to import the data.

Alternatively, you can use SQL to import data:

```sql
-- Example of importing data from a CSV file
COPY public.gaf_lookup(zip, city, state_name, mfr_code, pfr_code)
FROM '/path/to/gaf_lookup.csv'
WITH (FORMAT csv, HEADER true);
```

Replace `/path/to/gaf_lookup.csv` with the actual path to your CSV file.

## Conclusion

By running these queries, you can verify that all the necessary data, including GAF lookup and CPT codes, are properly loaded in your database. If you find that data is missing, you can import it using pgAdmin's import functionality or SQL commands.
