import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import {
    CourseAttemptService,
    CourseService,
    EnrollmentService,
    QuizAttemptService
} from "../_shared/Service/Services.ts";

const getUserProfile = async (request: EdgeFunctionRequest) => {

    const { userId } = request.getPayload();

    const [user, enrollments, completedCourses, quizAttempts] = await Promise.all([
        request.getUserById(userId),
        EnrollmentService.query('*', ['eq', 'user_id', userId]),
        CourseAttemptService.query('*', [['eq', 'user_id', userId], ['eq', 'pass', true]]),
        QuizAttemptService.query('*', [['eq', 'user_id', userId], ['notnull', 'end_time']])
    ]);

    const enrolledCourses = await CourseService.query('*', ['in', 'id', enrollments.map((e) => e.course_id)]);
    const enrolledCourseData = enrolledCourses.map((course) => {
        return {
            courseId: course.id,
            name: course.name
        };
    });

    const completedCourseData = completedCourses.map((courseAttempt) => {
        const course = enrolledCourses.find((course) => course.id === courseAttempt.course_id);
        return {
            name: course.name,
            completionTime: courseAttempt.end_time
        };
    });

    const quizAttemptData = (quizAttempts.map(async (quizAttempt) => {
        const course = enrolledCourses.find((course) => course.id === quizAttempt.course_id);
        return {
            id: quizAttempt.id,
            endTime: quizAttempt.end_time,
            courseId: quizAttempt.course_id,
            courseName: course.name,
            score: quizAttempt.score,
            maxScore: course.total_quiz_marks
        };
    })).sort((a, b) =>  new Date(b.end_time) - new Date(a.end_time));

    return {
        userId: user.id,
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        disabled: !!user.banned_until,
        signUpDate: user.created_at,
        lastUpdated: user.updated_at ?? -1,

        enrolledCourses: enrolledCourseData,
        completedCourses: completedCourseData,
        quizAttempts: quizAttemptData
    };
}

export default getUserProfile;
