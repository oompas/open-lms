import { supabaseClient } from "./config.ts";
import { pollAccessToken } from "./auth.ts";

/**
 * Calls a Supabase API endpoint
 *
 * @param endpoint Endpoint name (e.g. get-courses)
 * @param body Request body (e.g. { userId: faf456ae-68b3-4b71-8f54-52010844b6b3 })
 * @param admin True to sign in with admin test account, false to sign in with learner test account
 */
const callAPI = async (endpoint: string, body: object, admin: boolean): Promise<any> => {
    try {
        console.log(`Calling API endpoint: ${endpoint} as ${admin ? 'admin' : 'learner'} with body: ${JSON.stringify(body)}`);
        const accessToken = await pollAccessToken(admin);

        const options = {
            body: body,
            ...(accessToken && { headers: { 'Authorization': `Bearer ${accessToken}` } })
        }
        const { data, error } = await supabaseClient.functions.invoke(endpoint, options);

        if (error) {
            let errorMessage;

            // Safely try to extract detailed error information
            try {
                if (error.response && typeof error.response.json === 'function') {
                    const errorResponse = await error.response.json();
                    errorMessage = JSON.stringify(errorResponse);
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                } else {
                    errorMessage = JSON.stringify(error);
                }
            } catch (jsonError) {
                errorMessage = `Error parsing error response: ${error.message || JSON.stringify(error)}`;
            }

            console.log(`Error invoking function: ${errorMessage}`);
            return { error: errorMessage };
        }

        return data;
    } catch (error: any) {
        const errorMessage = error.message || JSON.stringify(error);
        console.error(`Uncaught error invoking Supabase Edge Function '${endpoint}': ${errorMessage}`);
        return { error: errorMessage };
    }
}

export { callAPI };
