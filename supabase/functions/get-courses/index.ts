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

        log("Staring func...");

        const userId = await getRequestUserId(req);

        const courses = await CourseService.getAllRows();

        log("Called course select...");

        const attempts = await getRows({ table: 'course_attempt', conditions: ['eq', 'user_id', userId] });
        if (attempts instanceof Response) return attempts;

        const courseData = await Promise.all(
            courses
                .filter((course) => course.active === true)
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
