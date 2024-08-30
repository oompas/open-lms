import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { adminClient } from "../_shared/adminClient.ts";
import { corsHeaders, errorResponse, successResponse } from "../_shared/helpers.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { email, password, name } = await req.json();

    console.log(`(1/3) Entering createAccount function with email: ${email}`);

    if (!email || !password) {
        return errorResponse("Email and password are required");
    }

    console.log(`(2/3) Email & password verified`);

    const userData = {
        email: email,
        password: password,
        user_metadata: {
            name: name,
            role: "Learner"
        }
    };
    const { data, error } = await adminClient.auth.admin.createUser(userData);

    if (error) {
        console.log(`Error creating user: ${error.message}`);
        return errorResponse(error.message);
    }

    console.log(`(3/3) User created successfully: ${data.user.email}`);
    return successResponse(data);
});
