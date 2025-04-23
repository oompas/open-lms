/**
 * Only one test can run at a time, otherwise data concurrency and state issues can appear
 * e.g. one test wipes the database while another tests needs the data
 *
 * This script provides a table and PostgreSQL functions to act as a mutex lock for test execution
 */

-- Store test mutex to block concurrent execution
CREATE TABLE public.test_mutex (
    id SERIAL PRIMARY KEY,
    execution_id UUID NOT NULL,
    environment TEXT NOT NULL,
    time_acquired TIMESTAMPTZ NOT NULL,
    expiration_time TIMESTAMPTZ NOT NULL
);

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_test_mutex_expiration
    ON test_mutex(expiration_time);


-- Function that checks if a test may proceed, adding a lock if it can
CREATE OR REPLACE FUNCTION try_acquire_mutex(
  p_execution_id UUID,
  p_environment TEXT,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_can_proceed BOOLEAN;
BEGIN
    -- Lock the table to prevent race conditions during the check and insert
    -- This ensures only one test can acquire the lock at a time
    LOCK TABLE test_mutex IN ACCESS EXCLUSIVE MODE;

    -- Check if there's an active mutex (non-expired)
    SELECT COUNT(*) = 0 INTO v_can_proceed
    FROM test_mutex
    WHERE expiration_time > NOW();

    -- If there's no active mutex or only expired ones
    IF v_can_proceed THEN
        -- Clean up any expired mutexes
        DELETE FROM test_mutex
        WHERE expiration_time <= NOW();

        -- Create a new mutex for this test run
        INSERT INTO test_mutex (time_acquired, expiration_time, execution_id, environment)
        VALUES (
           NOW(),
           NOW() + (p_duration_minutes * INTERVAL '1 minute'),
           p_execution_id,
           p_environment
        );

        RETURN TRUE;
    ELSE
        -- Cannot proceed, mutex is held by another test
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Release mutex at the end of test execution
-- This saves unnecessary wait time; if a test's timeout is 5 minutes, but it completes in 2 minutes, releasing
-- the mutex will save 3 minutes of wait time as the test doesn't need to wait until the mutex expires
CREATE OR REPLACE FUNCTION release_mutex(
    p_execution_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_rows_deleted INTEGER;
BEGIN
    -- Delete the mutex for this execution
    WITH deleted AS (
        DELETE FROM test_mutex
        WHERE execution_id = p_execution_id
        RETURNING *
    )
    SELECT COUNT(*) INTO v_rows_deleted FROM deleted;

    -- Return true if this function actually deleted the mutex
    RETURN v_rows_deleted > 0;
END;
$$ LANGUAGE plpgsql;
