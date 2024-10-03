import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { ErrorResponse, log, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { userId, name } = await req.json();

    log(`(1/3) Entering setup-account function with name: ${name}`);

    if (!name) {
        return ErrorResponse("Name is required");
    }

    log(`(2/3) Name verified`);

    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) {
        return ErrorResponse(`Error getting user: ${error.message}`);
    }
    const userMetadata = data?.user?.user_metadata;
    log(`User metadata: ${JSON.stringify(userMetadata)}`);
    if (userMetadata.name || userMetadata.role) {
        return ErrorResponse(`USer with id ${userId} has already been setup`);
    }

    const { data: data2, error: error2 } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { ...userMetadata, role: "Learner", name: name }
    });

    if (error2) {
        log(`Error setting up user: ${error2.message}`);
        return ErrorResponse(error2.message);
    }

    log(`(3/3) User setup successfully: ${data.user.email}`);
    return SuccessResponse(data);
});
