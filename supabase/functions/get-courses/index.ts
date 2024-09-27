import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse, log } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getCourseStatus } from "../_shared/functionality.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    log("Staring func...");

    const userId = await getRequestUserId(req);

    const courses = await getRows({ table: 'course', conditions: ['eq', 'active', true] });
    if (courses instanceof Response) return courses;

    log("Called course select...");

    const enrollment = await getRows({ table: 'enrolled_course', conditions: ['eq', 'user_id', userId] });
    if (enrollment instanceof Response) return enrollment;

    const attempts = await getRows({ table: 'course_attempt', conditions: ['eq', 'user_id', userId] });
    if (attempts instanceof Response) return attempts;

    const courseData = await Promise.all(
        courses
            .filter((course) => course.active === true)
            .map(async (course: any) => {
                const courseStatus = await getCourseStatus(course.id, userId);
                return {
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    status: courseStatus,
                    minTime: course.min_time,
                    maxQuizTime: course.max_quiz_time,
                }
            })
    );

    log("Returning success...");
    return successResponse(courseData);
});
