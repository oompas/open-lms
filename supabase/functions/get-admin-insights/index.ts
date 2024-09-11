import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getAllUsers, verifyAdministrator } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const adminVerify = verifyAdministrator(req);
    if (adminVerify instanceof Response) return adminVerify;

    const users = await getAllUsers();
    if (users instanceof Response) return users;

    const learners = users.filter((user) => user.user_metadata.role === "Learner")
        .map((user: any) => {
        return {
            id: user.id,
            email: user.email,
            name: user.user_metadata.name,
            role: user.user_metadata.role,

            coursesEnrolled: 0,
            coursesAttempted: 0,
            coursesCompleted: 0
        };
    });

    const admins = users.filter((user) => user.user_metadata.role === "Admin" || user.user_metadata.role === "Developer")
        .map((user: any) => {
        return {
            id: user.id,
            email: user.email,
            name: user.user_metadata.name,
            role: user.user_metadata.role,

            coursesCreated: 0,
            coursesPublished: 0
        };
    });

    const rspData = {
        quizAttemptsToMark: [],
        courseInsights: [],
        learners,
        admins
    };
    return successResponse(rspData);
});
