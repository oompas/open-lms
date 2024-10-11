import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SuccessResponse, log, OptionsRsp, InternalError } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req: Request) => {

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        log("Getting user ID, all courses, and user's enrollments...");

        const userId = await getRequestUserId(req);
        const { data, error } = await adminClient
            .from('course')
            .select(`
                id,
                name,
                description,
                min_time,
                quiz_time_limit,
                enrolled_course(status)
              `)
            .eq('active', true)
            .eq('enrolled_course.user_id', userId);

        log(`Request user id: '${userId}'. Queried ${data.length} courses`);

        const courseData = data
            .map((course: any) => {
                return {
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    status: course.enrolled_course[0]?.status ?? "NOT_ENROLLED",
                    minTime: course.min_time,
                    maxQuizTime: course.quiz_time_limit,
                }
            });

        log("Returning success...");
        return SuccessResponse(courseData);
    } catch (error) {
        log(`Error caught: ${error.message}`);
        return InternalError();
    }
});
