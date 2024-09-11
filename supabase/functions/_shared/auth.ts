import { adminClient } from "./adminClient.ts";
import { errorResponse } from "./helpers.ts";

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
 * Gets all users on the app
 */
const getAllUsers = async () => {
    const users = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (users.error) {
        return errorResponse(users.error.message);
    }

    return users.data.users;
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

/**
 * Check if the user is an administrator (or developer)
 * @param req The incoming request
 * @returns null if the user is an admin/dev, an error response if not
 */
const verifyAdministrator = async (req: Request): Promise<null | Response> => {
    const user = await getRequestUser(req);
    if (user?.user_metadata.role !== "Admin" || user?.user_metadata.role !== "Developer") {
        return errorResponse("You must be an administrator to perform this action");
    }
    return null;
}

export { createUser, getAllUsers, getRequestUser, getRequestUserId, verifyAdministrator };
