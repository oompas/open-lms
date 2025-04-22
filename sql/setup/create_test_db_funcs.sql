-- Wipes the database with the exception of the error_log table
CREATE OR REPLACE FUNCTION wipe_db()
RETURNS void AS $$
DECLARE
tbl_name text;
BEGIN
FOR tbl_name IN
    SELECT table_name
    FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name <> 'error_log'
    LOOP
        EXECUTE format('TRUNCATE TABLE %I CASCADE', tbl_name);
        RAISE NOTICE 'Truncated table: %', tbl_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if a user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_banned BOOLEAN;
BEGIN
    SELECT
        CASE
            WHEN banned_until IS NULL THEN FALSE
            WHEN banned_until < now() THEN FALSE
            ELSE TRUE
        END INTO is_banned
    FROM auth.users
    WHERE id = user_id;

    RETURN COALESCE(is_banned, FALSE);
END;
$$;
