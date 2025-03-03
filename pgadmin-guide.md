# Navigating pgAdmin to View Supabase Tables

This guide will walk you through how to navigate pgAdmin to view the tables in your Supabase database.

## Step 1: Expand the Server Connection

1. In the left sidebar of pgAdmin, you should see your server connection (named "LifePlan Genius" or whatever name you gave it).
2. Click on the **+** icon next to your server to expand it.
3. You may be prompted to enter your password again. If so, enter it and click "OK".

## Step 2: Navigate to the Database

1. After expanding the server, you'll see several folders including "Databases".
2. Expand the **Databases** folder.
3. Find your database (likely named "supabase_local_db" or similar) and expand it.

## Step 3: Navigate to the Schemas

1. Under your database, you'll see several folders including "Schemas".
2. Expand the **Schemas** folder.
3. You'll see several schemas, including:
   - **public**: This is the main schema where most of your tables are stored.
   - **auth**: This schema contains authentication-related tables.
   - **storage**: This schema contains storage-related tables.

## Step 4: View Tables in the Public Schema

1. Expand the **public** schema.
2. Expand the **Tables** folder.
3. You should now see a list of tables in the public schema, including:
   - **life_care_plans**: Contains life care plan records.
   - **care_plan_entries**: Contains entries for life care plans.
   - **gaf_lookup**: Contains geographic adjustment factors.

## Step 5: View Tables in the Auth Schema

1. Go back to the Schemas folder.
2. Expand the **auth** schema.
3. Expand the **Tables** folder.
4. You should see authentication-related tables, including:
   - **users**: Contains user records.
   - **identities**: Contains user identity information.
   - **sessions**: Contains user session information.

## Step 6: View Table Data

1. To view the data in a table, right-click on the table name.
2. Select **View/Edit Data** from the context menu.
3. Choose **All Rows** to see all the data in the table.
4. The data will be displayed in a grid view in the main panel.

## Step 7: Check for the Superuser

1. Navigate to the **auth** schema and find the **users** table.
2. View the data in the users table as described in Step 6.
3. Look for a user with the ID `11111111-1111-4111-a111-111111111111`. This is the superuser we created.

## Step 8: Check Foreign Key Relationships

1. To view the foreign key relationships, navigate to the **life_care_plans** table in the **public** schema.
2. Right-click on the table and select **Properties**.
3. In the properties dialog, click on the **Constraints** tab.
4. Look for constraints of type "Foreign Key". These show the relationships between tables.
5. You should see a foreign key constraint named `life_care_plans_user_id_fkey` that references the `users` table in the `auth` schema.

## Step 9: Execute SQL Queries

1. To run SQL queries, click on the **Query Tool** button in the toolbar (it looks like a lightning bolt).
2. In the query editor that opens, you can type SQL queries such as:

```sql
-- Check if the superuser exists
SELECT * FROM auth.users WHERE id = '11111111-1111-4111-a111-111111111111';

-- List all life care plans
SELECT * FROM public.life_care_plans;

-- View foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
```

3. Click the **Execute/Refresh** button (looks like a play button) to run the query.
4. The results will be displayed in the bottom panel.

## Step 10: Create the Superuser (If Not Already Created)

If you don't see the superuser in the users table, you can create it manually with this SQL query:

```sql
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  '11111111-1111-4111-a111-111111111111',
  'admin@example.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz',
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);
```

## Troubleshooting

### Can't See Tables

If you don't see any tables:

1. Make sure you're looking in the correct schema. Most application tables are in the **public** schema, while user tables are in the **auth** schema.
2. Try refreshing the view by right-clicking on the Tables folder and selecting **Refresh**.
3. Check that you have the correct database selected.

### Can't Connect to the Database

If you're having trouble connecting to the database:

1. Verify the connection information in the `.env` or `.env.local` file.
2. Make sure the PostgreSQL server is running.
3. Check that the port (usually 5432) is not blocked by a firewall.
4. Try running the `access-postgres-gui.js` script again to get the latest connection information.

### Foreign Key Constraint Error

If you're still seeing the foreign key constraint error:

1. Check if the superuser exists in the auth.users table.
2. Verify that the authService.ts file is using the fixed UUID.
3. Make sure the application is restarted after making these changes.
