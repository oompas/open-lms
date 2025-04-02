import { getEnvVariable, supabaseClient } from "./config.ts";

interface SignInResponse {
    session?: {
        access_token: string;
    };
    user?: {
        id: string;
        email: string;
    };
}

/**
 * Signs in to the client with a test account
 *
 * @param admin True to sign in with the test admin account, false to sign in with the test learner account
 */
const signIn = async (admin: boolean): Promise<SignInResponse> => {

    const userType = admin ? 'ADMIN' : 'LEARNER';
    const email = getEnvVariable(`TEST_${userType}_EMAIL`);
    const password = getEnvVariable(`TEST_${userType}_PASSWORD`);

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        throw new Error(`Error signing in ${userType} test user (/helpers/auth/signIn): ${error.message}`);
    }

    return data;
}

const pollAccessToken = async (admin: boolean): Promise<string> => {
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

export { signIn, pollAccessToken };
