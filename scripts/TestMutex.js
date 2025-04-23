import { createClient } from "@supabase/supabase-js";

class TestMutex {

    constructor(environment, testTimeout) {
        this.client = createClient(process.env.TEST_SUPABASE_URL, process.env.TEST_SUPABASE_ANON_KEY);

        this.executionId = crypto.randomUUID();
        this.environment = environment;

        this.testTimeoutMinutes = testTimeout;
        this.pollIntervalSeconds = 10;
        this.maxRetryAttempts = 3600 / this.pollIntervalSeconds;
    }

    /**
     * Try to acquire the mutex, retrying if necessary
     * @returns {Promise<boolean>} True if mutex acquired, false otherwise
     */
    async acquire() {
        console.log(`[TestMutex] Trying to acquire mutex for execution ${this.executionId} in ${this.environment}`);

        let attempts = 0;
        while (attempts < this.maxRetryAttempts) {
            // Try to acquire the mutex
            const { data, error } = await this.client.rpc('try_acquire_mutex', {
                p_execution_id: this.executionId,
                p_environment: this.environment,
                p_duration_minutes: this.testTimeoutMinutes
            });

            if (error) {
                console.error('[TestMutex] Error trying to acquire mutex:', error);
                throw error;
            }

            if (data !== true && data !== false) {
                console.error(`[TestMutex] Invalid value returned from try_acquire_mutex: ${data}`);
                throw error;
            }

            if (data === true) {
                console.log(`[TestMutex] Mutex acquired and verified for execution ${this.executionId}\n`);
                return true;
            }

            // Mutex not available, wait and try again
            attempts++;
            console.log(`[TestMutex] Mutex not available, waiting ${this.pollIntervalSeconds} seconds... (attempt ${attempts}/${this.maxRetryAttempts})`);
            await new Promise(resolve => setTimeout(resolve, this.pollIntervalSeconds * 1000));
        }

        throw new Error(`[TestMutex] Failed to acquire mutex after ${attempts} attempts\n`);
    }

    /**
     * Release the mutex
     * @returns {Promise<boolean>} True if mutex was released, false if it wasn't found
     */
    async release() {
        console.log(`[TestMutex] Releasing mutex for execution ${this.executionId}`);

        const { data, error } = await this.client.rpc('release_mutex', {
            p_execution_id: this.executionId
        });

        if (error) {
            console.error('[TestMutex] Error releasing mutex:', error);
            throw error;
        }

        if (data !== true && data !== false) {
            console.error(`[TestMutex] Invalid value returned from release_mutex: ${data}`);
            throw error;
        }

        if (data === true) {
            console.log(`[TestMutex] Mutex released for execution ${this.executionId}`);
            return true;
        }

        throw new Error(`[TestMutex] Function release_mutex returned false value (no mutex was deleted)`);
    }
}

export default TestMutex;
