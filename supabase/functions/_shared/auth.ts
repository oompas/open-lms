import { adminClient } from "./adminClient.ts";
import ApiError from "./Error/ApiError.ts";

/**
 * Get the user object from the edge function request
 * @returns The user object, or null if no user authorization in the request
 */
const getUserFromReq = async (): Promise<object> => {
    const { data: { user }, error } = await adminClient.auth.getUser(this.token);

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
const getAllUsers = async (): Promise<any[]> => {

    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) {
        throw ApiError(error.message);
    }

    return data.users;
}

export { getUserFromReq, getUserById, getAllUsers };
