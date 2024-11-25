import { supabaseClient } from "./config.ts";
import { signIn } from "./auth.ts";

const callAPI = async (endpoint: string, body: object, admin: boolean) => {
    try {
        // Get the user's session token (may take time to propagate)
        const startTime = Date.now();
        const timeout = 5000;
        let accessToken;

        while (Date.now() - startTime < timeout) {
            const session = await supabaseClient.auth.getSession();
            console.log("access_token: " + JSON.stringify(session?.data?.session?.access_token));
            if (session?.data?.session?.access_token) {
                accessToken = session.data.session.access_token;
                break;
            }

            await signIn(admin);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

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
