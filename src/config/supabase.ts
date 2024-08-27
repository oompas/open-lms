'use server'
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const cookieStore = cookies();

/**
 * Create a new Supabase Client for server-side usage (this won't work for client-side rendering)
 */
const client =
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

/**
 * Calls a Supabase Edge Function
 * @param endpoint The endpoint name
 * @param body The body of the request
 */
const callAPI = async (endpoint: string, body: object = {}) => {

    try {
        const response = await client.functions.invoke(endpoint, { body });

        return JSON.parse(JSON.stringify(response.data));
    } catch (error) {
        console.error(`Error calling Supabase Edge Function: ${error}`);
        return null;
    }
}

export default callAPI;
