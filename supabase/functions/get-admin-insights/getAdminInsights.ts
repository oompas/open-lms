import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService, EnrollmentService, QuizAttemptService } from "../_shared/Service/Services.ts";

const getAdminInsights = async (request: EdgeFunctionRequest) => {

    const [users, quizzesToMark, courses, enrollments] = await Promise.all([
        request.getAllUsers(),
        QuizAttemptService.query('*', [['null', 'pass'], ['notnull', 'end_time']]),
        CourseService.getAllRows(),
        EnrollmentService.getAllRows()
    ]);

    const quizAttemptsToMark = quizzesToMark.map((quizAttempt: any) => {
        const course = courses.find((c) => c.id === quizAttempt.course_id);
        const user = users.find((u) => u.id === quizAttempt.user_id);

        return {
            id: quizAttempt.id,
            courseName: course.name,
            timestamp: new Date(quizAttempt.end_time),
            userName: user.user_metadata.name
        }
    });

    const courseInsights = courses.map((course: any) => {
        return {
            id: course.id,
            name: course.name,

            numEnrolled: enrollments.filter((e) => e.course_id === course.id).length,
            numComplete: 0,
            avgTime: 0,
            avgQuizScore: 0
        }
    });

    const learners = users.filter((user) => user.user_metadata.role === "Learner").map((user: any) => {

        const userEnrollments = enrollments.filter(e => e.user_id === user.id);

        return {
            id: user.id,
            email: user.email,
            name: user.user_metadata.name,
            role: user.user_metadata.role,

            coursesEnrolled: userEnrollments.length,
            coursesAttempted: userEnrollments.filter((e) => e.status !== CourseStatus.ENROLLED).length,
            coursesCompleted: userEnrollments.filter((e) => e.status === CourseStatus.COMPLETED).length
        };
    });

    const admins = users.filter((user) => user.user_metadata.role === "Admin" || user.user_metadata.role === "Developer")
        .map((user: any) => {
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata.name,
                role: user.user_metadata.role,

                coursesCreated: courses.filter(c => c.user_id === user.id).length,
                coursesActive: courses.filter(c => c.user_id === user.id && c.active).length
            };
        });

    return {
        quizAttemptsToMark,
        courseInsights,
        learners,
        admins
    };
}

export default getAdminInsights;
