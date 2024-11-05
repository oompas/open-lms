import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { adminClient } from "../_shared/adminClient.ts";

const disableUser = async (request: EdgeFunctionRequest) => {

    const { userId, disable } = request.getPayload();

    await verifyAdministrator(request);

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: disable ? "876600h": "none" // Bans for 100 years
    });

    if (error) {
        request.log(`Error banning user: ${error.message}`);
        throw error;
    }

    return data;
}

export default disableUser;
