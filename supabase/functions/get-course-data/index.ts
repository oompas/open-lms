import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { log, OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { getRequestUserId } from "../_shared/auth.ts";
import CourseService from "../_shared/DatabaseService/CourseService.ts";
import CourseAttemptService from "../_shared/DatabaseService/CourseAttemptService.ts";
import QuizAttemptService from "../_shared/DatabaseService/QuizAttemptService.ts";

Deno.serve(async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    log(`Getting requesting user & course ID...`);

    const [_, userId] = await Promise.all([
        req.json(),
        getRequestUserId(req)
    ]);
    const { courseId } = _;

    log(`Querying course data, attempts and status...`);

    let [course, courseAttempts, courseStatus] = await Promise.all([
        CourseService.getById(courseId),
        CourseAttemptService.query([['eq', 'user_id', userId], ['eq', 'course_id', courseId]]),
        CourseService.getCourseStatus(courseId, userId)
    ]);

    log(`Constructing quiz data...`);

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

    log(`Constructing course attempt data...`);

    let attempts = null;
    const currentCourseAttempt = courseAttempts.length > 0
        ? courseAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
        : null;
    if (courseAttempts.length !== 0) {

        // If the course has no quiz and the time limit is passed, they've completed the course
        if (course.preserve_quiz_question_order === null
            && currentCourseAttempt.pass === null
            && new Date().getTime() > new Date(currentCourseAttempt.start_time).getTime() + course.min_time * 60 * 1000) {
            await CourseAttemptService.completeAttempt(currentCourseAttempt.id, true);
            courseStatus = "COMPLETED";
        }

        attempts = {
            numAttempts: courseAttempts.length,
            currentAttemptId: currentCourseAttempt?.id,
            currentStartTime: currentCourseAttempt ? new Date(currentCourseAttempt.start_time) : null
        }
    }

    log(`Constructing quiz attempt data...`);

    const quizAttemptData = {
        number: 0,
        currentId: null
    };
    if (currentCourseAttempt) {
        const quizAttempts = await QuizAttemptService.query(['eq', 'course_attempt_id', currentCourseAttempt.id]);

        const currentQuizAttempt = quizAttempts.length > 0
            ? quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
            : null;
        quizAttemptData.number = quizAttempts.length;
        quizAttemptData.currentId = currentQuizAttempt?.id;
    }

    log(`Returning response...`);

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
