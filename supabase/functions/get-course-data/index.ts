import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const userId = await getRequestUserId(req);

    const { id } = await req.json();

    const course = await getRows({ table: 'course', conditions: [['eq', 'id', id], ['eq', 'active', true]], expectResults: ['eq', 1] });
    if (course instanceof Response) return course;

    const courseData = course[0];
    let quizData = null;
    if (courseData.total_quiz_marks !== null) {
        quizData = {
            totalMarks: courseData.total_quiz_marks,
            maxAttempts: courseData.max_quiz_attempts,
            minScore: courseData.min_quiz_score,
            timeLimit: courseData.quiz_time_limit,
            numQuestions: courseData.num_quiz_questions,
        };
    }

    const enrollment = await getRows({ table: 'enrolled_course', conditions: [['eq', 'user_id', userId], ['eq', 'course_id', id]], expectResults: ['range', [0, 1]] });
    if (enrollment instanceof Response) return enrollment;

    const enrolled = enrollment.length > 0;
    const rsp = {
        id: courseData.id,
        name: courseData.name,
        description: courseData.description,
        link: courseData.link,
        status: enrolled ? 2 : 1,
        minTime: courseData.min_time,

        quiz: quizData,
    };
    return successResponse(rsp);
});
