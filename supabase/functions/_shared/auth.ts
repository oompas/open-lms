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

export { getAllUsers, getUserById };
