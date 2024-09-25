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

    const questionAttemptsQuery = await getRows({ table: 'quiz_question_attempt', conditions: ['eq', 'quiz_attempt_id', quizAttemptId] });
    if (questionAttemptsQuery instanceof Response) return questionAttemptsQuery;

    const response = {
        courseName: course.name,
        learnerName: user.name,
        completionTime: new Date(quizAttempt.end_time).getTime(),

        saQuestions: attemptData.filter((attempt) => attempt.type === "sa"),
        otherQuestions: attemptData.filter((attempt) => attempt.type !== "sa"),
        score: quizAttemptData.score,
        markingInfo: quizAttemptData.markerInfo
    };

    return successResponse(response);
});
