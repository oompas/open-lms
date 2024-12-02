import { getEnvVariable, supabaseClient } from "./config.ts";

const signIn = async (admin: boolean) => {

    const email = getEnvVariable(admin ? 'TEST_ADMIN_EMAIL' : 'TEST_LEARNER_EMAIL');
    const password = getEnvVariable(admin ? 'TEST_ADMIN_PASSWORD' : 'TEST_LEARNER_PASSWORD');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        throw error;
    }

    return data;
}

const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
}

const pollAccessToken = async (admin: boolean) => {
    const endTime = Date.now() + 2000; // 2s timeout

    while (Date.now() < endTime) {
        const session = await supabaseClient.auth.getSession();
        if (session?.data?.session?.access_token) {
            return session.data.session.access_token;
        }

        await signIn(admin);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error("Exceeded the 2 second timeout for polling for user access token");
}

export { signIn, signOut, pollAccessToken };
