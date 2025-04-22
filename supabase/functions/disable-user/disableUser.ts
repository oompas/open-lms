import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";
import PermissionError from "../_shared/Error/PermissionError.ts";

const disableUser = async (request: EdgeFunctionRequest) => {

    const { userId, disable } = request.getPayload();

    request.log(`Entering disableUser with userId ${userId} and disable ${disable}`);

    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);

    if (userError) {
        request.logErr('disableUser', `Error fetching user: ${userError.message}`);
        throw userError;
    }

    request.log(`Queried target user's account (${userData.user.email})`);

    const user = userData.user;

    if (user.app_metadata?.role === "Administrator" || user.app_metadata?.role === "Developer") {
        request.logErr('disableUser', `User with ID ${userId} is an Administrator/Developer and cannot be disabled.`);
        throw new PermissionError('Cannot disable an Administrator account.');
    }

    request.log(`User ${userId} is not an Administrator/Developer, processing with ${disable ? "disabling" : "enabling"}`);

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: disable ? "876600h" : "none" // Bans for 100 years
    });

    if (error) {
        request.logErr('disableUser', `Error disabling user: ${error.message}`);
        throw error;
    }

    request.log(`disableUser completed successfully for user ${userId}`);

    return null;
}

export default disableUser;
