import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, successResponse, errorResponse, log } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Get user data
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    console.log(`Token: ${token}`);
    const userRsp = await adminClient.auth.getUser(token);
    const userId = userRsp.data.user.id;

    const { id } = await req.json();

    const { data, error } = await adminClient.from('course').select().eq('id', id);

    if (error) {
        return errorResponse(error.message);
    }

    // TODO: return error if course in inactive
    if (data.length === 0) {
        return errorResponse(`Course with id ${id} not found`);
    }
    if (data.length > 1) {
        log(`Multiple courses found with the same ID (${id}) - invalid DB state`);
        return errorResponse(`Multiple courses found with the same ID (${id}) - invalid DB state`);
    }
    const course = data[0];

    let quizData = null;
    if (course.total_quiz_marks !== null) {
        quizData = {
            totalMarks: course.total_quiz_marks,
            maxAttempts: course.max_quiz_attempts,
            minScore: course.min_quiz_score,
            timeLimit: course.quiz_time_limit,
            numQuestions: course.num_quiz_questions,
        };
    }

    const { data: data2, error: error2 } = await adminClient.from('enrolled_course').select().eq('user_id', userId).eq('course_id', id);

    if (error2) {
        return errorResponse(error2.message);
    }
    const enrolled = data2.length > 0;

    const rsp = {
        id: course.id,
        name: course.name,
        description: course.description,
        link: course.link,
        status: enrolled ? 2 : 1,
        minTime: course.min_time,

        quiz: quizData,
    };
    return successResponse(rsp);
});
