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
    console.log(`\nCalling API endpoint: ${endpoint} as ${admin ? 'admin' : 'learner'} with body: ${JSON.stringify(body)}`);
    const accessToken = await pollAccessToken(admin);

    const options = {
        body: body,
        ...(accessToken && { headers: { 'Authorization': `Bearer ${accessToken}` } })
    }
    const { data, error } = await supabaseClient.functions.invoke(endpoint, options);

    if (error) {
        const errorData = await error?.context?.json();
        console.log(`Error caught: ${JSON.stringify(errorData, null, 4)}\n`);

        throw new Error(JSON.stringify(errorData.error));
    }

    console.log(`Endpoint result: ${JSON.stringify(data, null, 4)}\n`);

    return data;
}

export { callAPI };
