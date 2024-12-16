import { createClient } from "@supabase/supabase-js";

const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

const supabaseUrl = getEnvVariable('TEST_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('TEST_SUPABASE_ANON_KEY');

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseClient, getEnvVariable };
