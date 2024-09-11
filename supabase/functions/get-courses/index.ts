import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse, log } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";
import { getRequestUserId } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    log("Staring func...");

    const userId = await getRequestUserId(req);

    const courses = await getRows({ table: 'course', conditions: ['eq', 'active', true] });
    if (courses instanceof Response) return courses;

    log("Called course select...");

    const enrollment = await getRows({ table: 'enrolled_course', conditions: ['eq', 'user_id', userId] });
    if (enrollment instanceof Response) return enrollment;

    const courseData = courses
        .filter((course) => course.active === true)
        .map((course: any) => {
            return {
                id: course.id,
                name: course.name,
                description: course.description,
                status: enrollment.some((enrolledCourse: any) => enrolledCourse.course_id === course.id) ? 2 : 1,
                minTime: course.min_time,
                maxQuizTime: course.max_quiz_time,
            }
        });

    log("Returning success...");
    return successResponse(courseData);
});
