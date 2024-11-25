import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";
import { getCourseStatus } from "../_shared/functionality.ts";
import {
    CourseAttemptService,
    CourseService,
    EnrollmentService, QuizAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";

const getCourseInsightReport = async (request: EdgeFunctionRequest) => {

    const { courseId } = request.getPayload();

    request.log(`Entering getCourseInsightReport with course id ${courseId}`);

    const courseData = await CourseService.getById(courseId);
    const enrollments = await EnrollmentService.query('*', ['eq', 'course_id', courseId]);
    const quizQuestions = await QuizQuestionService.query('*', ['eq', 'course_id', courseId]);
    const courseAttempts = await CourseAttemptService.query('*', ['eq', 'course_id', courseId]);
    const quizAttempts = await QuizAttemptService.query('*', ['eq', 'course_id', courseId]);

    request.log(`Queried course, enrollment, and quiz data`);

    const numEnrolled = enrollments.length;
    const numStarted = enrollments.filter((enrollment) => enrollment.status != CourseStatus.ENROLLED).length;
    const numCompleted = enrollments.filter((enrollment) => enrollment.status === CourseStatus.COMPLETED).length;

    const completedAttempts = courseAttempts.filter((attempt) => attempt.pass == true);
    const averageTime = completedAttempts.reduce((sum, attempt) => {
        return sum + (new Date(attempt.end_time) - new Date(attempt.start_time));
    }, 0) / completedAttempts.length / 1000; // Time in seconds

    request.log(`Course has ${numEnrolled} enrollments, ${numStarted} started users, ${numCompleted} completions, and an average completion time of ${averageTime} seconds`);

    const learnerData = await Promise.all(enrollments.map(async (enrollment) => {
        const user = await request.getUserById(enrollment.user_id);

        const userQuizAttempts = quizAttempts.filter((attempt) => attempt.user_id === user.id);
        const latestQuizAttempt = QuizAttemptService.getLatest(userQuizAttempts);

        return {
            name: user.user_metadata.name,
            userId: user.id,
            status: enrollment.status,
            latestQuizAttemptId: latestQuizAttempt.id,
            latestQuizAttemptTime: new Date(latestQuizAttempt.end_time) - new Date(latestQuizAttempt.start_time)
        };
    }));

    request.log(`Learner data constructed for ${learnerData.length} users`);

    const questionData = quizQuestions.map((question) => {
        return {
            question: question.question,
            marks: question.marks,
            stats: question.submitted_answers
        };
    });

    request.log(`Question data constructed for ${questionData.length} questions`);

    return {
        courseName: courseData.name,
        numEnrolled: numEnrolled,
        numStarted: numStarted,
        numComplete: numCompleted,
        avgTime: averageTime,

        learners: learnerData,
        questions: questionData
    };
}

export default getCourseInsightReport;
