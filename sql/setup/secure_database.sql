/**
 * Add RLS and blanket block all database requests (note: service role (Edge Functions, console, etc) ignore rules)
 */
DO $$
DECLARE
tbl_name text;
BEGIN
    -- Loop through all tables in the public schema
    FOR tbl_name IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
    LOOP
        -- Enable Row-Level Security (RLS) on the table
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);

        -- Remove all access for non-service roles
        EXECUTE format('CREATE POLICY block_all_except_service_role on %I as RESTRICTIVE FOR ALL;', tbl_name);

        -- Revoke all privileges from the public role to ensure that only policies control access
        EXECUTE format('REVOKE ALL ON %I FROM public', tbl_name);
    END LOOP;
END $$;
