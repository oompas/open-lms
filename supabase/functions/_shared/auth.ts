import { adminClient } from "./adminClient.ts";
import ApiError from "./Error/types/ApiError.ts";

/**
 * Get the user object from the edge function request
 * @returns The user object, or null if no user authorization in the request
 */
const getUserFromReq = async (token: string): Promise<object> => {
    const { data: { user }, error } = await adminClient.auth.getUser(token);

    if (error) {
        throw new Error(`Error getting user in getUserFromReq: ${error.message}`);
    }

    return user;
}

/**
 * Gets a user object that has the specific ID. Note this should only be done by admins
 * @param userId User ID of the user to get
 */
const getUserById = async (userId: string): Promise<object> => {

    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (error) {
        throw new ApiError(error.message);
    }

    return data.user;
}

/**
 * Gets all users on the app
 */
const getAllUsers = async (): Promise<object[]> => {
    let allUsers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });

        if (error) {
            throw new ApiError(error.message);
        }

        allUsers = allUsers.concat(users);
        hasMore = users.length === 1000;
        page++;
    }

    return allUsers;
}

export { getUserFromReq, getUserById, getAllUsers };
