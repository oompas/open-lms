import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import {
    CourseAttemptService,
    CourseService,
    EnrollmentService,
    QuizAttemptService
} from "../_shared/Service/Services.ts";

const getAdminInsights = async (request: EdgeFunctionRequest) => {

    request.log(`Entering getAdminInsights...`);

    const [users, quizzesToMark, courses, enrollments, completedCourseAttempts, completedQuizAttempts] = await Promise.all([
        request.getAllUsers(),
        QuizAttemptService.query('*', [['null', 'pass'], ['notnull', 'end_time']]),
        CourseService.getAllRows(),
        EnrollmentService.getAllRows(),
        CourseAttemptService.query('*', ['notnull', 'pass']),
        QuizAttemptService.query('*', ['notnull', 'pass'])
    ]);

    request.log(`Queried ${users.length} users, ${quizzesToMark.length} quizzes to mark, ${courses.length} courses, and ${enrollments.length} course enrollments`);

    const quizAttemptsToMark = quizzesToMark.map((quizAttempt: any) => {
        const course = courses.find((c) => c.id === quizAttempt.course_id);
        const user = users.find((u) => u.id === quizAttempt.user_id);

        return {
            id: quizAttempt.id,
            courseName: course.name,
            timestamp: new Date(quizAttempt.end_time),
            userName: user.user_metadata.display_name
        }
    });

    request.log(`Constructed data for ${quizAttemptsToMark.length} quiz attempts to mark`);

    const courseInsights = courses.map((course: any) => {
        // Filter course-specific data
        const _courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
        const _completedCourseAttempts = completedCourseAttempts.filter((a) => a.course_id == course.id);
        const _completedQuizAttempts = completedQuizAttempts.filter((q) => q.course_id === course.id);

        // Calculate average time spent on course attempts
        const totalTimeSpent = _completedCourseAttempts.reduce((total, attempt) => {
            const startTime = new Date(attempt.start_time).getTime();
            const endTime = new Date(attempt.end_time).getTime();
            return total + (endTime - startTime) / 1000 / 60; // Convert milliseconds -> minutes
        }, 0);

        const avgTime = Math.round(_completedCourseAttempts.length > 0 ? totalTimeSpent / _completedCourseAttempts.length : 0);

        // Calculate quiz pass rate
        const numQuizPass = _completedQuizAttempts.filter((q) => q.pass === true).length;
        const quizPassRate = Math.round(numQuizPass / _completedQuizAttempts.length * 100);

        return {
            id: course.id,
            name: course.name,
            active: course.active,

            numEnrolled: _courseEnrollments.length,
            numComplete: _courseEnrollments.filter((e) => e.status == CourseStatus.COMPLETED).length,
            avgTime: avgTime,
            quizPassRate: quizPassRate
        }
    });

    request.log(`Constructed insights for ${courseInsights.length} courses`);

    const learners = users.filter((user) => (user.app_metadata.role ?? "Learner") === "Learner").map((user: any) => {
        const userEnrollments = enrollments.filter(e => e.user_id === user.id);

        return {
            id: user.id,
            email: user.email,
            name: user.user_metadata.display_name,
            role: user.app_metadata.role ?? "Learner",

            coursesEnrolled: userEnrollments.length,
            coursesAttempted: userEnrollments.filter((e) => e.status !== CourseStatus.ENROLLED).length,
            coursesCompleted: userEnrollments.filter((e) => e.status === CourseStatus.COMPLETED).length
        };
    });

    request.log(`Constructed data for ${learners.length} learners`);

    const admins = users.filter((user) => user.app_metadata.role === "Administrator" || user.app_metadata.role === "Developer")
        .map((user: any) => {
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata.display_name,
                role: user.app_metadata.role ?? "Learner",

                coursesCreated: courses.filter(c => c.user_id === user.id).length,
                coursesActive: courses.filter(c => c.user_id === user.id && c.active).length
            };
        });

    request.log(`Constructed data for ${admins.length} admins/developers`);

    return {
        quizAttemptsToMark,
        courseInsights,
        learners,
        admins
    };
}

export default getAdminInsights;
