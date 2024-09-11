import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, errorResponse, log, successResponse } from "../_shared/helpers.ts";
import { createUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { email, password, name } = await req.json();

    log(`(1/3) Entering createAccount function with email: ${email}`);

    if (!email || !password) {
        return errorResponse("Email and password are required");
    }

    log(`(2/3) Email & password verified`);

    const userData = {
        email: email,
        password: password,
        name: name
    };
    const { data, error } = await createUser(userData);

    if (error) {
        log(`Error creating user: ${error.message}`);
        return errorResponse(error.message);
    }

    log(`(3/3) User created successfully: ${data.user.email}`);
    return successResponse(data);
});
