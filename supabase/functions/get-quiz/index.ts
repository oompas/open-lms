import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";

console.log("Hello from Functions!")

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { quizAttemptId } = await req.json();

    const quizAttempt = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttempt instanceof Response) return quizAttempt;

    const course = await getRows({ table: 'course', conditions: ['eq', 'id', quizAttempt.course_id] });
    if (course instanceof Response) return course;

    const questions = await getRows({ table: 'quiz_question', conditions: ['eq', 'course_id', course.id] });
    if (questions instanceof Response) return questions;

    return successRsponse(questions);
});
