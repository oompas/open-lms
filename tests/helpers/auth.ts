import { supabaseClient } from "./config.ts";

const prefix = "UNIT_TEST_ACCOUNT_PREFIX_";

const createAccount = async (email: string, password: string) => {
    const fullEmail = prefix + email;
    const { data, error } = await supabaseClient.auth.signUp({ email: fullEmail, password });

    if (error) {
        throw new Error(`Error signing up: ${error}`);
    }
}

const signIn = async (admin: boolean) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: 'UNIT_TEST',
        password: 'testpassword',
    });
}

const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
}

export { createAccount, signIn };
