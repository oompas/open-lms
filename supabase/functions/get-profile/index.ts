import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    console.log(`Token: ${token}`);
    const { data, error } = await adminClient.auth.getUser(token);

    console.log(`Error: ${error}`);

    const userData = {
        name: data.user.user_metadata.name,
        email: data.user.email,
        signUpDate: data.user.created_at,
        completedCourses: [],
    }

    return successResponse(userData);
});
