import { createClient } from "@supabase/supabase-js";

const testUrl = process.env.TEST_SUPABASE_URL;
const testAnonKey = process.env.TEST_SUPABASE_ANON_KEY;

if (!testUrl) {
    throw new Error(`Test environment URL not found`);
}
if (!testAnonKey) {
    throw new Error(`Test environment URL not found`);
}
if (!/https:\/\/[a-z]+.supabase.co/.test(testUrl)) {
    throw new Error("Invalid test environment URL");
}
if (!/[a-zA-Z0-9.-]+/.test(testAnonKey)) {
    throw new Error("Invalid test environment anon key");
}

const supabaseClient = createClient(testUrl, testAnonKey);

export { supabaseClient };
