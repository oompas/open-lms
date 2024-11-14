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

export { getAllUsers };
