import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";
import DatabaseError from "../_shared/Error/DatabaseError.ts";

const setupAccount = async (request: EdgeFunctionRequest) => {

    const { userId, name } = request.getPayload();

    request.log(`Entering setup-account function for UUID '${userId}' with name: ${name}`);

    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) {
        throw new Error(`Error getting user: ${error.message}`);
    }
    const userMetadata = data?.user?.user_metadata;
    request.log(`User metadata: ${JSON.stringify(userMetadata)}`);
    if (userMetadata.name || userMetadata.role) {
        throw new DatabaseError(`User with id ${userId} has already been setup`);
    }

    const { error: error2 } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { ...userMetadata, role: "Learner", name: name }
    });

    if (error2) {
        request.log(`Error setting up user: ${error2.message}`);
        throw new DatabaseError(`Error updating user metadata: ${error2.message}`);
    }

    request.log(`User setup successfully: ${data.user.email}`);

    return null;
}

export default setupAccount;
