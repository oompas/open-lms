import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCurrentTimestampTz, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";
import { getCourseStatus } from "../_shared/functionality.ts";
import { adminClient } from "../_shared/adminClient.ts";
import CourseService from "../_shared/DatabaseService/CourseService.ts";
import CourseAttemptService from "../_shared/DatabaseService/CourseAttemptService.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const userId = await getRequestUserId(req);

    const { courseId } = await req.json();
    
    const course = await CourseService.getById(courseId);

    const courseAttempts = await CourseAttemptService.query([['eq', 'user_id', userId], ['eq', 'course_id', courseId]]);

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

    let attempts = null;
    const currentCourseAttempt = courseAttempts.length > 0
        ? courseAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
        : null;
    if (courseAttempts.length !== 0) {

        // If the course has no quiz and the time limit is passed, they've completed the course
        if (course.preserve_quiz_question_order === null
            && currentCourseAttempt.pass === null
            && new Date().getTime() > new Date(currentCourseAttempt.start_time).getTime() + course.min_time * 60 * 1000) {
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

    const quizAttemptData = {
        number: 0,
        currentId: null
    };
    if (currentCourseAttempt) {
        const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: ['eq', 'course_attempt_id', currentCourseAttempt.id] });
        if (quizAttempts instanceof Response) return quizAttempts;

        const currentQuizAttempt = quizAttempts.length > 0
            ? quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
            : null;
        quizAttemptData.number = quizAttempts.leng;
        quizAttemptData.currentId = currentQuizAttempt?.id;
    }

    const courseStatus = await CourseService.getCourseStatus(courseId, userId);

    const rsp = {
        id: course.id,
        active: course.active,
        name: course.name,
        description: course.description,
        link: course.link,
        status: courseStatus,
        minTime: course.min_time,

        quizData: quizData,
        courseAttempt: attempts,
        quizAttempts: quizAttemptData
    };
    return SuccessResponse(rsp);
});
