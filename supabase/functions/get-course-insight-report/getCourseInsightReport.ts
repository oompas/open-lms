import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";
import { getCourseStatus } from "../_shared/functionality.ts";
import {
    CourseAttemptService,
    CourseService,
    EnrollmentService, QuizAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";

const getCourseInsightReport = async (request: EdgeFunctionRequest) => {

    const { courseId } = request.getPayload();

    const courseData = await CourseService.getById(courseId);
    const enrollments = await EnrollmentService.query('*', ['eq', 'course_id', courseId]);
    const quizQuestions = await QuizQuestionService.query('*', ['eq', 'course_id', courseId]);
    const courseAttempts = await CourseAttemptService.query('*', ['eq', 'course_id', courseId]);
    const quizAttempts = await QuizAttemptService.query('*', ['eq', 'course_id', courseId]);

    const learnerData = await Promise.all(enrollments.map(async (enrollment) => {
        const user = await request.getUserById(enrollment.user_id);
        const status = await getCourseStatus(courseId, enrollment.user_id);
        const quizAttempts = await getRows({ table: 'quiz_attempt', conditions: [['eq', 'course_id', courseId], ['notnull', 'end_time']] });
        if (quizAttempts instanceof Response) return quizAttempts;

        let latestQuizAttemptId = null;
        let latestQuizAttemptTime = null;
        if (quizAttempts.length > 0) {
            const latestQuiz = quizAttempts.reduce((latest, current) => {
                return new Date(current.start_time) > new Date(latest.start_time) ? current : latest;
            });

            if (latestQuiz) {
                latestQuizAttemptId = latestQuiz.id;
                latestQuizAttemptTime = new Date(latestQuiz.end_time) - new Date(latestQuiz.start_time);
            }
        }

        return {
            name: user.user_metadata.name,
            userId: user.id,
            status: status,
            latestQuizAttemptId: latestQuizAttemptId,
            latestQuizAttemptTime: latestQuizAttemptTime
        };
    }));

    const questionData = quizQuestions.map((question) => {
        return {
            question: question.question,
            marks: question.marks,
            stats: question.submitted_answers
        };
    });

    const completedAttempts = courseAttempts.filter((attempt) => attempt.pass === true);
    const averageTime = completedAttempts.reduce((sum, attempt) => {
        return sum + (new Date(attempt.end_time) - new Date(attempt.start_time));
    }, 0) / completedAttempts.length / 1000; // Time in seconds

    return {
        courseName: courseData.name,
        learners: learnerData,
        questions: questionData,
        numEnrolled: enrollments.length,
        numStarted: courseAttempts.length,
        numComplete: completedAttempts.length,
        avgTime: averageTime
    };
}

export default getCourseInsightReport;
