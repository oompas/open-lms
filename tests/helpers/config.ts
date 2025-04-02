import { createClient } from "@supabase/supabase-js";

// Add all environment variable names here so they can be validated immediately
const envars: string[] = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "TEST_SUPABASE_URL",
    "TEST_SUPABASE_ANON_KEY",
    "TEST_ADMIN_EMAIL",
    "TEST_ADMIN_PASSWORD",
    "TEST_LEARNER_EMAIL",
    "TEST_LEARNER_PASSWORD"
];

const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

for (const envar of envars) {
    getEnvVariable(envar); // Throws error if any envars aren't defined
}

// Setup supabase client
const supabaseUrl = getEnvVariable('TEST_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('TEST_SUPABASE_ANON_KEY');

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseClient, getEnvVariable };
