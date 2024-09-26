import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, successResponse } from "../_shared/helpers.ts";
import { getUserById, verifyAdministrator } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const adminStatus = await verifyAdministrator(req);
    if (adminStatus instanceof Response) return adminStatus;

    const { quizAttemptId } = await req.json();

    const quizAttemptQuery = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'id', quizAttemptId] });
    if (quizAttemptQuery instanceof Response) return quizAttemptQuery;
    const quizAttempt = quizAttemptQuery[0];

    const courseQuery = await getRows({ table: 'course', conditions: ['eq', 'id', quizAttempt.course_id] });
    if (courseQuery instanceof Response) return courseQuery;
    const course = courseQuery[0];

    const user = await getUserById(req, quizAttempt.user_id);
    if (user instanceof Response) return user;

    const questionAttempts = await getRows({ table: 'quiz_question_attempt', conditions: ['eq', 'quiz_attempt_id', quizAttemptId] });
    if (questionAttempts instanceof Response) return questionAttempts;

    const questions = await getRows({ table: 'quiz_question', conditions: ['eq', 'course_id', quizAttempt.course_id] });
    if (questions instanceof Response) return questions;

    const saQuestions = questionAttempts.filter((q) => q.type === "SA").map((q) => {
        const question = questions.find((question) => question.id === q.quiz_question_id);
        return {
            question: question.question,
            marks: question.marks,
            questionAttemptId: q.id,
            response: q.response,
            marksAchieved: q.marks_achieved
        };
    });

    const otherQuestions = questionAttempts.filter((q) => q.type !== "SA").map((q) => {
        const question = questions.find((question) => question.id === q.quiz_question_id);
        return {
            question: question.question,
            type: question.type,
            answers: question.answers,
            correctAnswer: question.correct_answer,
            marks: question.marks,
            response: q.response,
            marksAchieved: q.marks_achieved
        };
    });

    const response = {
        courseName: course.name,
        submitterName: user.user_metadata.name,
        completionTime: new Date(quizAttempt.end_time),
        saQuestions: saQuestions,
        otherQuestions: otherQuestions,
        score: quizAttempt.score,
        markingInfo: quizAttempt.markerInfo
    };

    return successResponse(response);
});
