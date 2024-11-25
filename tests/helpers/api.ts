import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabaseClient } from "./config.ts";

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

        return data;
    } catch (error: any) {
        console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(error)} '${error.message}'`);
        return { error: error.message };
    }
}

export { callAPI };
