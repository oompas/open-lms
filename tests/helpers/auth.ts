import { supabaseClient } from "./config.ts";

const TEST_LEARNER_EMAIL = process.env.TEST_LEARNER_EMAIL!;
const TEST_LEARNER_PASSWORD = process.env.TEST_LEARNER_PASSWORD!;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL!;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD!;

const signIn = async (admin: boolean) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: admin ? TEST_ADMIN_EMAIL : TEST_LEARNER_EMAIL,
        password: admin ? TEST_ADMIN_PASSWORD : TEST_LEARNER_PASSWORD,
    });

    if (error) {
        throw error;
    }

    return data;
}

const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
}

export { signIn, signOut };
