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

    queue_time TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    expiration_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    execution_time TEXT,

    timeout_minutes INTEGER,
    passed BOOLEAN
);

-- Optimize the query that checks for active test runs
CREATE INDEX IF NOT EXISTS idx_test_execution_active
    ON public.test_execution(end_time, expiration_time)
    WHERE end_time IS NULL;

-- Optimize the query for finding the oldest queued test
CREATE INDEX IF NOT EXISTS idx_test_execution_queue_time
    ON public.test_execution(queue_time)
    WHERE start_time IS NULL AND queue_time IS NOT NULL;


-- Function that checks if a test may proceed, adding a lock if it can, or queuing if required
CREATE OR REPLACE FUNCTION try_acquire_mutex(
  p_execution_id UUID,
  p_environment TEXT,
  p_duration_minutes INTEGER,
  p_test_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_can_start BOOLEAN := FALSE;
    v_is_queued BOOLEAN;
    v_oldest_queued_id UUID;
BEGIN
    -- Lock the table to prevent race conditions during the check and insert/updates
    LOCK TABLE public.test_execution IN ACCESS EXCLUSIVE MODE;

    -- Check if the current test is already queued
    SELECT EXISTS (
        SELECT 1
        FROM public.test_execution
        WHERE execution_id = p_execution_id
            AND queue_time IS NOT NULL
            AND start_time IS NULL
    ) INTO v_is_queued;

    /**
     * There are four cases:
     * 1. A test is currently running. Queue this test (if not already queued)
     * 2. A test isn't running and this test is first in the queue. Start this test
     * 3. A test isn't running and the queue is empty. Start this test
     * 4. A test isn't running and the queue has another test first. Queue this test (if not already queued)
     */

    -- Check if there's an active test running
    IF NOT EXISTS (
        SELECT 1
        FROM public.test_execution
        WHERE end_time IS NULL
          AND expiration_time > NOW()
    ) THEN

        -- No active test, check for queued tests
        SELECT execution_id
        INTO v_oldest_queued_id
        FROM public.test_execution
        WHERE queue_time IS NOT NULL
          AND start_time IS NULL
        ORDER BY queue_time
        LIMIT 1;

        IF v_oldest_queued_id = p_execution_id THEN
            -- This test was the first in the queue, start it now
            UPDATE public.test_execution
            SET start_time = NOW(),
                expiration_time = NOW() + (p_duration_minutes * INTERVAL '1 minute'),
                queue_time = NULL
            WHERE execution_id = p_execution_id;

            -- The test has started
            v_can_start := TRUE;
        ELSIF v_oldest_queued_id IS NULL THEN
            -- No queued tests, start immediately
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

            -- The test has started
            v_can_start := TRUE;
        ELSE
            -- Another test is first in the queue. Queue the test if it isn't already queued
            IF NOT v_is_queued THEN
                INSERT INTO public.test_execution (
                    execution_id,
                    environment,
                    test_type,
                    timeout_minutes,
                    queue_time
                )
                VALUES (
                    p_execution_id,
                    p_environment,
                    p_test_type,
                    p_duration_minutes,
                    NOW()
                );
            END IF;

            -- Active test and queue, this test hasn't started yet
            v_can_start := FALSE;
        END IF;
    ELSE
        -- An active test is running. Queue the test if it isn't already queued
        IF NOT v_is_queued THEN
            INSERT INTO public.test_execution (
                execution_id,
                environment,
                test_type,
                timeout_minutes,
                queue_time
            )
            VALUES (
                p_execution_id,
                p_environment,
                p_test_type,
                p_duration_minutes,
                NOW()
            );
        END IF;

        -- Active test is running, this test hasn't started yet
        v_can_start := FALSE;
    END IF;

    RETURN v_can_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release mutex at the end of test execution to save excess wait time. Also saves test metadata
CREATE OR REPLACE FUNCTION complete_test_run(
    p_execution_id UUID,
    p_passed BOOLEAN
) AS $$
DECLARE
    v_rows_updated INTEGER;
    v_start_time TIMESTAMPTZ;
BEGIN
    -- Lock the table to prevent race conditions
    LOCK TABLE public.test_execution IN ACCESS EXCLUSIVE MODE;

    -- Get the start time for this execution
    SELECT start_time INTO v_start_time
        FROM public.test_execution
        WHERE execution_id = p_execution_id;

    -- Verify this test run exists
    IF v_start_time IS NULL THEN
        RAISE EXCEPTION 'No test run found with execution_id: %', p_execution_id;
    END IF;

    -- Update the record for this execution
    UPDATE public.test_execution
    SET end_time = NOW(),
        execution_time = TO_CHAR((NOW() - v_start_time), 'HH24:MI:SS'),
        passed = p_passed
    WHERE execution_id = p_execution_id;

    -- Verify this test execution was updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to update test run with execution_id: %', p_execution_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
