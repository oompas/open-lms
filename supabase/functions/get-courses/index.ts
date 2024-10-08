import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SuccessResponse, log, OptionsRsp, InternalError } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import CourseService from "../_shared/DatabaseService/CourseService.ts";

Deno.serve(async (req: Request) => {

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        log("Staring function...");

        const userId = await getRequestUserId(req);

        log(`User id: ${userId}`);

        const courses = await CourseService.query(['eq', 'active', true]);

        log(`Queried ${courses.length} courses`);

        const courseData = await Promise.all(
            courses
                .map(async (course: any) => {
                    const status = await CourseService.getCourseStatus(course.id, userId);
                    return {
                        id: course.id,
                        name: course.name,
                        description: course.description,
                        status: status,
                        minTime: course.min_time,
                        maxQuizTime: course.quiz_time_limit,
                    }
                })
        );

        log("Returning success...");
        return SuccessResponse(courseData);
    } catch (error) {
        log(`Error caught: ${error.message}`);
        return InternalError();
    }
});
