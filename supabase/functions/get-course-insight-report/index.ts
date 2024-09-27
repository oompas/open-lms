import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, log, successResponse } from "../_shared/helpers.ts";
import { verifyAdministrator } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const adminStatus = await verifyAdministrator(req);
    if (adminStatus instanceof Response) return adminStatus;

    const { courseId } = await req.json();

    const courseData = await getRows({ table: 'course', conditions: ['eq', 'id', courseId] });
    if (courseData instanceof Response) return courseData;

    const enrollments = await getRows({ table: 'enrolled_course', conditions: ['eq', 'course_id', courseId] });
    if (enrollments instanceof Response) return enrollments;

    const quizQuestions = await getRows({ table: 'quiz_question', conditions: ['eq', 'course_id', courseId] });
    if (quizQuestions instanceof Response) return quizQuestions;

    const attempts = await getRows({ table: 'course_attempt', conditions: ['eq', 'course_id', courseId] });
    if (attempts instanceof Response) return attempts;

    const questionData = quizQuestions.map((question) => {
        return {
            question: question.question,
            marks: question.marks,
            stats: question.submitted_answers
        };
    });

    const completedAttempts = attempts.filter((attempt) => attempt.pass === true);
    const averageTime = completedAttempts.reduce((sum, attempt) => {
        return sum + (new Date(attempt.end_time) - new Date(attempt.start_time));
    }, 0) / completedAttempts.length / 1000; // Time in seconds

    const responseData = {
        courseName: courseData[0].name,
        learners: [],
        questions: questionData,
        numEnrolled: enrollments.length,
        numStarted: attempts.length,
        numComplete: completedAttempts.length,
        avgTime: averageTime
    };

    return successResponse(responseData);
});
