import { adminClient } from "./adminClient.ts";
import { ErrorResponse } from "./helpers.ts";

/**
 * Gets all users on the app
 */
const getAllUsers = async () => {
    const users = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (users.error) {
        return ErrorResponse(users.error.message);
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

    if (user?.data?.user) {
        return user.data.user
    }
    throw new Error(`Requesting user with token ${token} does not exist`);
}

/**
 * Get the user ID from the edge function request
 * @param req The incoming request
 * @returns The user ID, or null if no user authorization in the request
 */
const getRequestUserId = async (req: Request): Promise<string> => (await getRequestUser(req))?.id;

/**
 * Gets a user object that has the specific ID. Note this should only be done by admins
 * @param userId User ID of the user to get
 */
const getUserById = async (userId: string): Promise<object> => {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (error) {
        return ErrorResponse(error.message);
    }

    return data.user;
}

export { createUser, getAllUsers, getRequestUser, getRequestUserId, getUserById };
