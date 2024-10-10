import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SuccessResponse, ErrorResponse, OptionsRsp } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { adminClient } from "../_shared/adminClient.ts";
import EnrollmentService from "../_shared/DatabaseService/Impl/EnrollmentService.ts";
import { CourseStatus } from "../_shared/DatabaseService/Impl/CourseService.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const userId = await getRequestUserId(req);
    const { id: courseID } = await req.json();

    const courseAttempt = {
        course_id: courseID,
        user_id: userId
    };

    const { data, error } = await adminClient.from('course_attempt').insert(courseAttempt);

    await EnrollmentService.updateStatus(courseID, userId, CourseStatus.IN_PROGRESS);

    if (error) {
        return ErrorResponse(error.message);
    }

    return SuccessResponse(data);
});
