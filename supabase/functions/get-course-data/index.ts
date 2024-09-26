import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, log, successResponse } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";
import Course from "../_shared/DatabaseObjects/Course.ts";
import { getCourseStatus } from "../_shared/functionality.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const userId = await getRequestUserId(req);

    const { courseId } = await req.json();

    const course = await getRows({ table: 'course', conditions: ['eq', 'id', courseId] });
    if (course instanceof Response) return course;

    const courseData = course[0];

    log(`Course data: ${JSON.stringify(courseData)}`);
    const courseObj = new Course(courseData);
    log(`Course object data: ${courseObj.toJSON(true)}`);
    log(`Data and object data are equal: ${JSON.stringify(courseData, null, 4) === courseObj.toJSON(true)}`);

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

    const courseAttempts = await getRows({ table: 'course_attempt', conditions: [['eq', 'user_id', userId], ['eq', 'course_id', courseId]] });
    if (courseAttempts instanceof Response) return courseAttempts;

    const courseStatus = await getCourseStatus(courseId, userId);

    let attempts = null;
    if (courseAttempts.length !== 0) {
        const current = courseAttempts.find(c => c.pass === null);

        let quizAttempt = null;
        if (current) {
            quizAttempt = await getRows({ table: 'quiz_attempt', conditions:
                    [['eq', 'course_id', courseId], ['eq', 'user_id', userId], ['eq', 'course_attempt_id', current.id]] });
            if (quizAttempt instanceof Response) return quizAttempt;
        }

        attempts = {
            numAttempts: courseAttempts.length,
            currentAttemptId: current?.id,
            currentStartTime: current ? new Date(current.start_time).getTime() : null,
            currentQuizAttemptId: quizAttempt?.id ?? null
        }
    }

    const rsp = {
        id: courseData.id,
        active: courseData.active,
        name: courseData.name,
        description: courseData.description,
        link: courseData.link,
        status: courseStatus,
        minTime: courseData.min_time,

        quizData: quizData,
        courseAttempt: attempts,
        quizAttempts: 1
    };
    return successResponse(rsp);
});
