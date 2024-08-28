"use client";
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const signIn = async (email: string, password: string) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(`Error signing in: ${error.message}`);
    }

    return { data, error };
}

export { signIn };
