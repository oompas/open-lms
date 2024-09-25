import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const adminStatus = await verifyAdministrator(req);
    if (adminStatus instanceof Response) return adminStatus;

    const { courseId } = await req.json();

    const courseData = await getRows({ table: 'course', conditions: ['eq', 'id', courseId] });
    if (courseData instanceof Response) return courseData;


    const responseData = {
        courseName: courseData[0].name,
        learners: [],
        questions: [],
        numEnrolled: [],
        numStarted: [],
        numComplete: [],
        avgTime: 0, // In seconds
    };

    return successResponse(responseData);
});
