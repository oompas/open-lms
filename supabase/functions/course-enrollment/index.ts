import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { ErrorResponse, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const userId = await getRequestUserId(req);

    const { id } = await req.json();

    const course = await getRows({ table: 'enrolled_course', conditions: [['eq', 'user_id', userId], ['eq', 'course_id', id]], expectResults: ['range', [0, 1]] });
    if (course instanceof Response) return course;

    if (course.length === 0) {
        const { error: error2 } = await adminClient.from('enrolled_course').insert({ user_id: userId, course_id: id });

        if (error2) {
            return ErrorResponse(error2.message);
        }
    } else {
        const { error: error3 } = await adminClient.from('enrolled_course').delete().eq('user_id', userId).eq('course_id', id);

        if (error3) {
            return ErrorResponse(error3.message);
        }
    }

    return SuccessResponse({ enrolled: course.length === 0 });
});
