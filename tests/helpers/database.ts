import { supabaseClient } from "./config.ts";

class TestDatabaseHelper {
    /**
     * Wipes the entire test database with the exception of the error_log table
     * Does not delete test accounts or edit configurations
     */
    public static async wipeDatabase() {
        const { error } = await supabaseClient.rpc('wipe_db');

        if (error) {
            throw new Error(`Error wiping database: ${error.message}`);
        } else {
            console.log(`Database wiped!`);
        }
    }
}

export default TestDatabaseHelper;
