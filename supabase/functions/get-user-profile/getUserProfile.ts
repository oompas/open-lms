import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import {
    CourseAttemptService,
    CourseService,
    EnrollmentService,
    QuizAttemptService
} from "../_shared/Service/Services.ts";

const getUserProfile = async (request: EdgeFunctionRequest) => {

    const { userId } = request.getPayload();

    const user = await request.getUserById(userId);
    const enrollments = await EnrollmentService.query('*', ['eq', 'user_id', user.id]);
    const completedCourses = await CourseAttemptService.query('*', [['eq', 'user_id', user.id], ['eq', 'pass', true]]);
    const quizAttempts = await QuizAttemptService.query('*', [['eq', 'user_id', user.id], ['notnull', 'end_time']]);

    const enrolledData = await Promise.all(enrollments.map(async (enrolled) => {
        const courses = await CourseService.query('*', ['eq', 'id', enrolled.course_id]);
        return {
            courseId: enrolled.course_id,
            name: courses[0].name
        };
    }));

    const completedCourseData = await Promise.all(completedCourses.map(async (courseAttempt) => {
        const courses = await CourseService.query('*', ['eq', 'id', courseAttempt.course_id]);
        return {
            name: courses[0].name,
            completionTime: courseAttempt.end_time
        };
    }));

    const quizAttemptData = (await Promise.all(quizAttempts.map(async (quizAttempt) => {
        const courses = await CourseService.query('*', ['eq', 'id', quizAttempt.course_id]);
        return {
            id: quizAttempt.id,
            endTime: quizAttempt.end_time,
            courseId: quizAttempt.course_id,
            courseName: courses[0].name,
            score: quizAttempt.score,
            maxScore: courses[0].total_quiz_marks
        };
    }))).sort((a, b) =>  new Date(b.end_time) - new Date(a.end_time));

    return {
        userId: user.id,
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        disabled: !!user.banned_until,
        signUpDate: user.created_at,
        lastUpdated: user.updated_at ?? -1,

        enrolledCourses: enrolledData,
        completedCourses: completedCourseData,
        quizAttempts: quizAttemptData
    };
}

export default getUserProfile;
