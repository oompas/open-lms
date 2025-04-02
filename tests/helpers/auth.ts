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

// Currently signed-in user
let currentUserType: 'ADMIN' | 'LEARNER' | null = null;

/**
 * Signs in to the client with a test account
 *
 * @param admin True to sign in with the test admin account, false to sign in with the test learner account
 */
const signIn = async (admin: boolean): Promise<SignInResponse> => {

    const userType = admin ? 'ADMIN' : 'LEARNER';

    // If we're already signed in as the requested user type, no need to sign in again
    if (currentUserType === userType) {
        const session = await supabaseClient.auth.getSession();
        if (session?.data?.session) {
            const { data: { user, session: currentSession } } = await supabaseClient.auth.getUser();

            // Return in SignInResponse format
            return {
                user: user!,
                session: currentSession!
            };
        }
    }

    // Different user or no session - sign out first to ensure clean state
    if (currentUserType !== null) {
        await supabaseClient.auth.signOut();
    }

    const email = getEnvVariable(`TEST_${userType}_EMAIL`);
    const password = getEnvVariable(`TEST_${userType}_PASSWORD`);

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        throw new Error(`Error signing in ${userType} test user (/helpers/auth/signIn): ${error.message}`);
    }

    // Update the current user type for future sign-ins
    currentUserType = userType;

    return data;
}

/**
 * Gets the desired test user's access token through polling
 * Note: Signing in may have a delay with the session, so this function retries for up to 2 seconds
 *
 * @param admin True to sign in with the test admin user, false to sign in with the test learner user
 */
const pollAccessToken = async (admin: boolean): Promise<string> => {
    const endTime = Date.now() + 2000; // 2s timeout
    const userType = admin ? 'ADMIN' : 'LEARNER';

    // First try to sign in to ensure we have the correct user
    await signIn(admin);

    while (Date.now() < endTime) {
        const session = await supabaseClient.auth.getSession();

        if (session?.data?.session?.access_token) {
            // Verify this is actually the correct user type by checking email
            const userEmail = session?.data?.session?.user?.email;
            const expectedEmail = getEnvVariable(admin ? 'TEST_ADMIN_EMAIL' : 'TEST_LEARNER_EMAIL');

            if (userEmail === expectedEmail) {
                return session.data.session.access_token;
            } else {
                // Wrong user is signed in - sign out and try again
                console.warn(`Wrong user signed in (${userEmail}), expected ${expectedEmail}`);
                await supabaseClient.auth.signOut();
                currentUserType = null;
                await signIn(admin);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error(`Timed out (>2 seconds) waiting for ${userType} access token`);
}

export { signIn, pollAccessToken };
