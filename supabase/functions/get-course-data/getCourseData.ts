import { CourseAttemptService, CourseService, QuizAttemptService } from "../_shared/Service/Services.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";

const getCourseData = async (request: EdgeFunctionRequest): Promise<object> => {

    request.log(`Getting requesting user & course ID...`);

    const userId: string = request.getRequestUserId();
    const { courseId } = request.getPayload();

    request.log(`User id: ${userId}. Course id: ${courseId}`);

    const { course_attempt: courseAttempts, enrolled_course: [enrollment], ...course } = await CourseService
        .query(`
            *,
            course_attempt(id, start_time),
            enrolled_course(status)
          `,
            [
                ['eq', 'id', courseId],
                ['eq', 'active', true],
                ['eq', 'course_attempt.user_id', userId],
                ['eq', 'course_attempt.course_id', courseId],
                ['eq', 'enrolled_course.course_id', courseId],
                ['eq', 'enrolled_course.user_id', userId]
            ],
            true);
    let courseStatus = enrollment?.status ?? "NOT_ENROLLED";

    request.log(`Course status: ${courseStatus}. Course attempts: ${courseAttempts?.length ?? 0}. Course: ${JSON.stringify(course)}`);

    let quizData = null;
    if (course.total_quiz_marks !== null) {
        quizData = {
            totalMarks: course.total_quiz_marks,
            maxAttempts: course.max_quiz_attempts,
            minScore: course.min_quiz_score,
            timeLimit: course.quiz_time_limit,
            numQuestions: course.num_quiz_questions
        };
    }

    request.log(`Course quiz data: ${JSON.stringify(quizData)}`);

    let attempts = null;
    const latestCourseAttempt = CourseAttemptService.getLatest(courseAttempts);
    if (latestCourseAttempt !== null) {
        attempts = {
            numAttempts: courseAttempts.length,
            currentAttemptId: latestCourseAttempt.id,
            currentStartTime: new Date(latestCourseAttempt.start_time)
        }
    }

    request.log(`Course attempt data: ${JSON.stringify(attempts)}`);

    const quizAttemptData = {
        number: 0,
        currentId: null
    };
    if (latestCourseAttempt) {
        const quizAttempts = await QuizAttemptService.query('id, start_time', ['eq', 'course_attempt_id', latestCourseAttempt.id]);

        const currentQuizAttempt = quizAttempts.length > 0
            ? quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
            : null;
        quizAttemptData.number = quizAttempts.length;
        quizAttemptData.currentId = currentQuizAttempt?.id;
    }

    request.log(`Quiz attempt data: ${JSON.stringify(quizAttemptData)}`);

    return {
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
}

export default getCourseData;
