import { supabaseClient } from "./config.ts";

const prefix = "UNIT_TEST_ACCOUNT_PREFIX_";

const createAccount = async (email: string, password: string) => {
    const fullEmail = prefix + email;
    const { data, error } = await supabaseClient.auth.signUp({ email: fullEmail, password });

    if (error) {
        throw new Error(`Error signing up: ${error}`);
    }
}

export { createAccount };
