import { adminClient } from "./adminClient.ts";

type UserData = {
    email: string,
    password: string,
    name: string,
};

/**
 * Create a new user in Supabase Auth
 * @param userData The new user's email, password and name
 */
const createUser = async (userData: UserData) => {
    const formattedUserData = {
        email: userData.email,
        password: userData.password,
        user_metadata: {
            name: userData.name,
            role: "Learner"
        }
    };

    return await adminClient.auth.admin.createUser(formattedUserData);
}

/**
 * Get the user object from the edge function request
 * @param req The incoming request
 * @returns The user object, or null if no user authorization in the request
 */
const getRequestUser = async (req: Request): Promise<object> => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const user = await adminClient.auth.getUser(token);

    return user ? user.data.user : null;
}

/**
 * Get the user ID from the edge function request
 * @param req The incoming request
 * @returns The user ID, or null if no user authorization in the request
 */
const getRequestUserId = async (req: Request): Promise<string> => (await getRequestUser(req))?.id;

export { createUser, getRequestUser, getRequestUserId };
