import { createClient, FunctionsHttpError } from "@supabase/supabase-js";

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

const callAPI = async (endpoint: string, body: object = {}) => {
    try {
        // Get the user's session token
        const session = await supabaseClient.auth.getSession();
        const accessToken = session?.data?.session?.access_token;

        const options = {
            body: body,
            ...(accessToken && { headers: { 'Authorization': `Bearer ${accessToken}` } })
        }
        const { data, error } = await supabaseClient.functions.invoke(endpoint, options);

        if (error && error instanceof FunctionsHttpError) { // @ts-ignore
            const errorResponse = await error.response.json();
            return { error: errorResponse };
        }

        return { data: data };
    } catch (error: any) {
        console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(error)} '${error.message}'`);
        return { error: error.message };
    }
}

export { supabaseClient, callAPI };
