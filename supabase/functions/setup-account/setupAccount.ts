import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";

const setupAccount = async (request: EdgeFunctionRequest) => {

    const { userId, name } = request.getPayload();

    request.log(`Entering setup-account function with name: ${name}`);

    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) {
        throw new Error(`Error getting user: ${error.message}`);
    }
    const userMetadata = data?.user?.user_metadata;
    request.log(`User metadata: ${JSON.stringify(userMetadata)}`);
    if (userMetadata.name || userMetadata.role) {
        throw new Error(`User with id ${userId} has already been setup`);
    }

    const { data: data2, error: error2 } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { ...userMetadata, role: "Learner", name: name }
    });

    if (error2) {
        request.log(`Error setting up user: ${error2.message}`);
        throw error2;
    }

    request.log(`User setup successfully: ${data.user.email}`);

    return null;
}

export default setupAccount;
