"use client";
import { createClient } from "@supabase/supabase-js";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(`Error signing in: ${error.message}`);
    }

    return { data, error };
}

const handleLoginStatus = (router: AppRouterInstance, authPage: boolean) => {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            router.push('/home');
        } else if (event === 'SIGNED_OUT') {
            router.push('/');
        }
    });
}

export { signIn, handleLoginStatus };
