import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // This function gets a specific user's profile - must be an admin to do so
    const adminCheck = await verifyAdministrator(req);
    if (adminCheck instanceof Response) return adminCheck;

    const userData = {
        name: "joe",
        email: "joe@joe.com",
        role: "big learner",
        disabled: false,
        signUpDate: 1,
        lastSignIn: -1,
        enrolledCourses: [],
        completedCourses: [],
        quizAttempts: []
    };

    return successResponse(userData);
});
