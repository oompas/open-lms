import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse, errorResponse, log } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    log("Staring func...");

    const courses = await getRows({ table: 'course', filters: ['eq', 'active', true] });
    if (courses instanceof Response) return courses;

    log("Called course select...");

    const courseData = courses
        .filter((course) => course.active === true)
        .map((course: any) => {
            return {
                id: course.id,
                name: course.name,
                description: course.description,
                status: 1, // TODO: Update when enrolling and all that works
                minTime: course.min_time,
                maxQuizTime: course.max_quiz_time,
            }
        });

    log("Returning success...");
    return successResponse(courseData);
});
