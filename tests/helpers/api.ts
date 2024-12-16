import { supabaseClient } from "./config.ts";
import { pollAccessToken } from "./auth.ts";

const callAPI = async (endpoint: string, body: object, admin: boolean) => {
    try {
        const accessToken = await pollAccessToken(admin);

        const options = {
            body: body,
            ...(accessToken && { headers: { 'Authorization': `Bearer ${accessToken}` } })
        }
        const { data, error } = await supabaseClient.functions.invoke(endpoint, options);

        if (error) {
            const errorResponse = await error.response.json();

            console.log(`Error invoking function: ${errorResponse}`);
            return { error: errorResponse };
        }

        return data;
    } catch (error: any) {
        console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(error)} '${error.message}'`);
        return { error: error.message };
    }
}

export { callAPI };
