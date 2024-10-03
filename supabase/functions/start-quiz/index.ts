import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, ErrorResponse, SuccessResponse } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { getRequestUserId } from "../_shared/auth.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const userId = await getRequestUserId(req);
    const { courseId, courseAttemptId } = await req.json();

    const quizAttempt = {
        course_id: courseId,
        user_id: userId,
        course_attempt_id: courseAttemptId
    };

    const { data, error } = await adminClient.from('quiz_attempt').insert(quizAttempt).select();

    if (error) {
        return ErrorResponse(error.message);
    }

    return SuccessResponse(data[0].id);
});
