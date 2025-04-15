/**
 * Delete and re-create all database tables (ALL DATABASE DATA IS LOST !!!)
 */
DO $$
DECLARE
tbl_name text;
BEGIN
FOR tbl_name IN
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'  -- Users table is in auth schema so it's safe
    LOOP
        EXECUTE format('DROP TABLE %I CASCADE', tbl_name);
END LOOP;
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Auto generate UUIDs in database
