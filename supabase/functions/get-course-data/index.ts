import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCurrentTimestampTz, log, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";
import Course from "../_shared/DatabaseObject/Course.ts";
import { getCourseStatus } from "../_shared/functionality.ts";
import { adminClient } from "../_shared/adminClient.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
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

    let attempts = null;
    const currentCourseAttempt = courseAttempts.length > 0
        ? courseAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
        : null;
    if (courseAttempts.length !== 0) {

        // If the course has no quiz and the time limit is passed, they've completed the course
        if (courseData.preserve_quiz_question_order === null
            && currentCourseAttempt.pass === null
            && new Date().getTime() > new Date(currentCourseAttempt.start_time).getTime() + courseData.min_time * 60 * 1000) {
            await adminClient.from('course_attempt').update({ pass: true, end_time: getCurrentTimestampTz() }).eq('id', currentCourseAttempt.id);
        }

        let quizAttempt = null;
        if (currentCourseAttempt) {
            quizAttempt = await getRows({ table: 'quiz_attempt', conditions:
                    [['eq', 'course_id', courseId], ['eq', 'user_id', userId], ['eq', 'course_attempt_id', currentCourseAttempt.id]] });
            if (quizAttempt instanceof Response) return quizAttempt;
        }

        attempts = {
            numAttempts: courseAttempts.length,
            currentAttemptId: currentCourseAttempt?.id,
            currentStartTime: currentCourseAttempt ? new Date(currentCourseAttempt.start_time) : null,
            currentQuizAttemptId: quizAttempt?.id ?? null
        }
    }

    let quizAttemptData = {
        number: 0,
        currentId: null
    };
    if (currentCourseAttempt) {
        const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'course_attempt_id', currentCourseAttempt.id] });
        if (quizAttempts instanceof Response) return quizAttempts;

        const currentQuizAttempt = quizAttempts.length > 0
            ? quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
            : null;
        quizAttemptData = {
            number: quizAttempts.length,
            currentId: currentQuizAttempt?.id
        };
    }

    const courseStatus = await getCourseStatus(courseId, userId);

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
        quizAttempts: quizAttemptData
    };
    return SuccessResponse(rsp);
});
