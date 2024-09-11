import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse, getRequestUser } from "../_shared/helpers.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const user = await getRequestUser(req);
    const userData = {
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        signUpDate: user.created_at,
        completedCourses: [],
    }

    return successResponse(userData);
});
