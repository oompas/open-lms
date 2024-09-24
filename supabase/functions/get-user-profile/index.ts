import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getUserById, verifyAdministrator } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { userId } = await req.json();

    const user = await getUserById(req, userId);
    if (user instanceof Response) return user;

    const userData = {
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        disabled: false,
        signUpDate: user.created_at,
        lastSignIn: user.last_sign_in_at ?? -1,
        enrolledCourses: [],
        completedCourses: [],
        quizAttempts: [],
    };

    return successResponse(userData);
});
