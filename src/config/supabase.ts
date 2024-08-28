"use client";
import { createClient, FunctionsHttpError } from "@supabase/supabase-js";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Signs in a user client-side
 */
const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(`Error signing in: ${error.message}`);
    }

    return { data, error };
}

/**
 * Call on each page to handle login routing (if you're logged in, route to hte homepage, if not, route to the login page)
 * @param router useRouter() hook instance
 */
const handleLoginStatus = (router: AppRouterInstance) => {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            router.push('/home');
        } else if (event === 'SIGNED_OUT') {
            router.push('/');
        }
    });
}

type APIResponse = {
    success: boolean,
    serverError?: boolean,
    data?: any,
    error?: any,
}

/**
 * Calls a Supabase Edge Function
 * @param endpoint The endpoint name
 * @param body The body of the request
 */
const callAPI = async (endpoint: string, body: object = {}): Promise<APIResponse> => {
    try {
        const { data, error } = await supabaseClient.functions.invoke(endpoint, { body });
        console.log(`Data: ${JSON.stringify(data)} Error: ${JSON.stringify(error)}`);

        if (error && error instanceof FunctionsHttpError) {
            const errorResponse = await error.response.json();
            console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(errorResponse)}`);
            return { error: errorResponse };
        }

        return { data: data };
    } catch (error) {
        console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(error)} ${error instanceof SyntaxError} '${error.message}'`);
        return { error: error.message };
    }
}

export { signIn, handleLoginStatus, callAPI };
