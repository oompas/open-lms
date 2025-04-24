/**
 * Only one test can run at a time, otherwise data concurrency and state issues can appear
 * e.g. one test wipes the database while another tests needs the data
 *
 * This script provides a table and PostgreSQL functions to act as a mutex lock for test execution
 */

-- Store test mutex to block concurrent execution
CREATE TABLE public.test_execution (
    execution_id UUID PRIMARY KEY,
    environment TEXT CHECK (environment IN ('LOCAL', 'GITHUB_ACTIONS')),
    test_type TEXT CHECK (test_type IN ('SANITY', 'DETAILED')),

    start_time TIMESTAMPTZ NOT NULL,
    expiration_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    execution_time TEXT,

    timeout_minutes INTEGER,
    pass_fail BOOLEAN
);

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_test_execution_expiration
    ON public.test_execution(expiration_time);

-- Index for the try_acquire_mutex function
-- This optimizes the query that checks for active test runs
CREATE INDEX IF NOT EXISTS idx_test_execution_active
    ON public.test_execution(end_time, expiration_time)
    WHERE end_time IS NULL;


-- Function that checks if a test may proceed, adding a lock if it can
CREATE OR REPLACE FUNCTION try_acquire_mutex(
  p_execution_id UUID,
  p_environment TEXT,
  p_duration_minutes INTEGER,
  p_test_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_can_proceed BOOLEAN;
BEGIN
    -- Lock the table to prevent race conditions during the check and insert
    LOCK TABLE public.test_execution IN ACCESS EXCLUSIVE MODE;

    -- Check if there's an active test running (no end_time yet)
    SELECT COUNT(*) = 0 INTO v_can_proceed
        FROM public.test_execution
        WHERE end_time IS NULL
        AND expiration_time > NOW();

    -- If there's no active test or only completed ones
    IF v_can_proceed THEN
        -- Create a new record for this test run
        INSERT INTO public.test_execution (
            start_time,
            expiration_time,
            execution_id,
            environment,
            test_type,
            timeout_minutes
        )
        VALUES (
            NOW(),
            NOW() + (p_duration_minutes * INTERVAL '1 minute'),
            p_execution_id,
            p_environment,
            p_test_type,
            p_duration_minutes
        );

        RETURN TRUE;
    ELSE
        -- Cannot proceed, mutex is held by another test
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release mutex at the end of test execution to save wait time, and saves execution data
CREATE OR REPLACE FUNCTION complete_test_run(
    p_execution_id UUID,
    p_pass_fail BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
    v_rows_updated INTEGER;
    v_start_time TIMESTAMPTZ;
BEGIN
    -- Get the start time for the execution
    SELECT start_time INTO v_start_time
        FROM public.test_execution
        WHERE execution_id = p_execution_id;

    -- Check if the test run exists
    IF v_start_time IS NULL THEN
        RAISE EXCEPTION 'No test run found with execution_id: %', p_execution_id;
    END IF;

    -- Update the record for this execution
    WITH updated AS (
        UPDATE public.test_execution
        SET end_time = NOW(),
            execution_time = TO_CHAR((NOW() - v_start_time), 'HH24:MI:SS'),
            pass_fail = p_pass_fail
        WHERE execution_id = p_execution_id
        RETURNING *
    )
    SELECT COUNT(*) INTO v_rows_updated FROM updated;

    -- Return true if this function actually updated the record
    RETURN v_rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
