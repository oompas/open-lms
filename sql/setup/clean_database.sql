/**
 * Delete and re-create all database tables (!!! ALL DATABASE DATA IS LOST !!!)
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

-- Deletes all database functions
DO $$
DECLARE
    func RECORD;
BEGIN
FOR func IN (
    SELECT
        r.routine_name,
        string_agg(p.data_type, ', ' ORDER BY p.ordinal_position) AS params
    FROM information_schema.routines r
    LEFT JOIN information_schema.parameters p
        ON r.specific_name = p.specific_name
        AND r.specific_schema = p.specific_schema
    WHERE r.routine_type = 'FUNCTION'
        AND r.specific_schema = 'public'
    GROUP BY r.routine_name, r.specific_name
) LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
        func.routine_name,
        COALESCE(func.params, ''));
END LOOP;
END $$;
