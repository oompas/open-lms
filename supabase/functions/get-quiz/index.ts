import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { quizAttemptId } = await req.json();

    const quizAttemptQuery = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttemptQuery instanceof Response) return quizAttemptQuery;
    const quizAttempt = quizAttemptQuery[0];

    const courseQuery = await getRows({ table: 'course', conditions: ['eq', 'id', quizAttempt.course_id] });
    if (courseQuery instanceof Response) return courseQuery;
    const course = courseQuery[0];

    const questions = await getRows({ table: 'quiz_question', conditions: ['eq', 'course_id', course.id] });
    if (questions instanceof Response) return questions;

    const data = {
        courseName: course.name,
        numAttempts: -1,
        maxAttempts: course.max_quiz_attempts,
        timeLimit: course.quiz_time_limit,
        startTime: new Date(quizAttempt.start_time),
        questions: questions.map((q) => {
            return {
                id: q.id,
                order: q.question_order,
                question: q.question,
                marks: q.marks,
                type: q.type,
                answers: q.answers
            };
        })
    }

    return SuccessResponse(data);
});
