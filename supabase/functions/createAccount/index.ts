import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { adminClient } from "../_config/adminClient.ts";
import { errorResponse, successResponse } from "../_helpers/response.ts";

Deno.serve(async (req) => {
    const { email, password } = await req.json();

    console.log(`(1/3) Entering createAccount function with email: ${email}`);

    if (!email || !password) {
        return errorResponse("Email and password are required");
    }

    console.log(`(2/3) Email & password verified`);

    const { data, error } = await adminClient.auth.admin.createUser({ email, password });

    if (error) {
        console.log(`Error creating user: ${error.message}`);
        return errorResponse(error.message);
    }

    console.log(`(3/3) User created successfully: ${data.user.email}`);
    return successResponse(data);
});
