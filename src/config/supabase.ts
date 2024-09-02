"use client";
import { createClient, FunctionsHttpError } from "@supabase/supabase-js";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useSession } from "@supabase/auth-helpers-react";

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
 * Signs out a user client-side
 */
const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error(`Error signing out: ${error.message}`);
    }

    return { error };
}

/**
 * Call first on each page to handle auth routing (sign in users -> home, sign out users -> signIn)
 * @param router useRouter() hook instance
 * @param isAuthPage If this is an auth page (sign in, sign up, etc.)
 */
const handleLoginStatus = (router: AppRouterInstance, isAuthPage: boolean) => {
    const session = useSession();

    if (session?.user && isAuthPage) {
        router.push('/home');
    } else if (session === null && !isAuthPage) {
        router.push('/');
    }
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
 * @param withAuth Whether or not to include the user's auth token in the request headers
 */
const callAPI = async (endpoint: string, body: object = {}, withAuth: boolean = true): Promise<APIResponse> => {
    try {
        // Get the user's session token (for endpoints that require user auth)
        const session = withAuth ? await supabaseClient.auth.getSession() : null;

        const options = {
            body: body,
            ...(withAuth && { headers: { 'Authorization': `Bearer ${session?.data.session.access_token}` } })
        }
        const { data, error } = await supabaseClient.functions.invoke(endpoint, options);

        if (error && error instanceof FunctionsHttpError) {
            const errorResponse = await error.response.json();
            return { error: errorResponse };
        }

        return { data: data };
    } catch (error) {
        console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(error)} '${error.message}'`);
        return { error: error.message };
    }
}

export { signIn, signOut, handleLoginStatus, callAPI, supabaseClient };
