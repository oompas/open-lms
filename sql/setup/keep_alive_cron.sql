/**
 * Schedules a simple cron job every 6 days to keep the project from pausing
 */

-- Enable the pg_cron extension if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.keep_alive()
RETURNS void AS $$
BEGIN
  PERFORM 1; -- Simple query to generate activity
END;
$$ LANGUAGE plpgsql;

-- Run every 6 days 4/5 AM Eastern (4 in the winter, 5 in the summer)
SELECT cron.schedule(
    'keep_project_alive',
    '0 9 */6 * *',
    'SELECT public.keep_alive()'
);
