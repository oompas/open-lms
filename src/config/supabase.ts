'use server'
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FunctionsHttpError } from '@supabase/supabase-js'

const cookieStore = cookies();

/**
 * Create a new Supabase Client for server-side usage (this won't work for client-side rendering)
 */
const serverClient =
    createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: "", ...options });
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        },
    );

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
        const { data, error } = await serverClient.functions.invoke(endpoint, { body });

        if (error && error instanceof FunctionsHttpError) {
            return { error: await error.context.json() };
        }

        return { data: data };
    } catch (error) {
        console.error(`Error invoking Supabase Edge Function '${endpoint}': ${JSON.stringify(error)} ${error instanceof SyntaxError} '${error.message}'`);
        return { error: error.message };
    }
}

export { callAPI };
