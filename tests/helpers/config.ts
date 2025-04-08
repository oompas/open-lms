import { createClient } from "@supabase/supabase-js";
import Constants from "./constants.ts";

// Setup supabase client
const supabaseUrl = Constants.envars.TEST_SUPABASE_URL;
const supabaseAnonKey = Constants.envars.TEST_SUPABASE_ANON_KEY;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Sessions can complicate test states, it's easier to just check and sign in again
        autoRefreshToken: false,
        persistSession: false
    }
});

export { supabaseClient };
