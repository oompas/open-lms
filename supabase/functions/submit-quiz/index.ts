import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, errorResponse, log, successResponse } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { quizAttemptId, responses } = await req.json();

    const userId = await getRequestUserId(req);
    if (userId instanceof Response) return userId;

    const quizAttemptQuery = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttemptQuery instanceof Response) return quizAttemptQuery;
    const quizAttempt = quizAttemptQuery[0];

    const quizQuestions = await getRows({ table: 'quiz_question', conditions: ['eq', 'course_id', quizAttempt.course_id] });
    if (quizQuestions instanceof Response) return quizQuestions;

    if (quizQuestions.length !== responses.length) {
        return errorResponse(`There are ${quizQuestions.length} quiz questions, but only ${responses.length} responses were provided`);
    }
    if (!responses.every((r) => quizQuestions.some((q) => q.id === r.questionId))) {
        return errorResponse(`Quiz question IDs and response IDs don't fully match`);
    }

    log(`Verification passed!`);

    // Mark quiz questions
    let totalMarks = 0;
    let autoMark = true;
    const quizQuestionAttempts = quizQuestions.map((q) => {

        const response = responses.find((r) => r.questionId === q.id);
        let marks;
        if (q.type === "MC" || q.type === "TF") {
            marks = q.correct_answer === response.answer ? q.marks : 0;
            totalMarks += marks;
        } else if (q.type === "SA") {
            marks = null;
            autoMark = false;
        } else {
            return errorResponse(`Unknown question type: ${q.type}`);
        }

        return {
            course_id: quizAttempt.course_id,
            user_id: userId,
            quiz_question_id: q.id,
            course_attempt_id: quizAttempt.course_attempt_id,
            quiz_attempt_id: quizAttemptId,

            response: response.answer,
            max_marks: q.marks,
            marks_achieved: marks
        };
    });
    if (quizQuestionAttempts instanceof Response) return quizQuestionAttempts;

    const { data, error } = await adminClient.from('quiz_question_attempt').insert(quizQuestionAttempts);

    if (error) {
        return errorResponse(`Error adding quiz questions attempts: ${error.message}`);
    }

    return successResponse(data);
});
