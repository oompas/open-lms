import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseAttemptService, EnrollmentService, QuizAttemptService } from "../_shared/Service/Services.ts";

const getProfile = async (request: EdgeFunctionRequest): Promise<object> => {

    const { userId } = request.getPayload();

    if (!userId) {
        const user = request.getRequestUser();

        request.log(`Entering getProfile for user ${user}`);

        const completedCourseQuery = await CourseAttemptService
            .query(`
            id,
            course_id,
            end_time,
            course(name)
            `,
                [
                    ['eq', 'user_id', user.id],
                    ['eq', 'pass', true]
                ]
            );

        request.log(`Successfully queried completed courses: ${JSON.stringify(completedCourseQuery)}`);

        const completedCourseData = completedCourseQuery.map((courseAttempt) => {
            return {
                courseId: courseAttempt.id,
                name: courseAttempt.course.name,
                date: courseAttempt.end_time
            };
        });

        request.log(`Parsed completed course data: ${JSON.stringify(completedCourseData)}`);

        return {
            name: user.user_metadata.name,
            email: user.email,
            role: user.user_metadata.role,
            signUpDate: user.created_at,
            completedCourses: completedCourseData
        }
    }

    request.log(`Entering getProfile (admin) to get the profile of user ${userId}`);

    request.validateAdmin("Getting a user profile for a specific user requires admin permissions");

    const [user, enrollments, completedCourses, quizAttempts] = await Promise.all([
        request.getUserById(userId),
        EnrollmentService.query('*, course(*)', ['eq', 'user_id', userId]),
        CourseAttemptService.query('*', [['eq', 'user_id', userId], ['eq', 'pass', true]]),
        QuizAttemptService.query('*', [['eq', 'user_id', userId], ['notnull', 'end_time']])
    ]);

    request.log(`Queried user data, ${enrollments.length} enrollments, ${completedCourses.length} completed course attempts, and ${quizAttempts.length} completed quiz attempts`);

    const enrolledCourseData = enrollments.map((enrollment) => {
        return {
            courseId: enrollment.course.id,
            name: enrollment.course.name
        };
    });

    request.log(`Built data for ${enrolledCourseData.length} enrolled courses`);

    const completedCourseData = completedCourses.map((courseAttempt) => {
        const course = enrollments.find((enrollment) => enrollment.course.id === courseAttempt.course_id);
        return {
            name: course.name,
            completionTime: courseAttempt.end_time
        };
    });

    request.log(`Built data for ${completedCourseData.length} completed courses`);

    const quizAttemptData = (quizAttempts.map(async (quizAttempt) => {
        const course = enrollments.find((enrollment) => enrollment.course.id === quizAttempt.course_id);
        return {
            id: quizAttempt.id,
            endTime: quizAttempt.end_time,
            courseId: quizAttempt.course_id,
            courseName: course.name,
            score: quizAttempt.score,
            maxScore: course.total_quiz_marks
        };
    })).sort((a, b) => new Date(b.end_time) - new Date(a.end_time));

    request.log(`Built data for ${quizAttemptData.length} quiz attempts`);

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

export default getProfile;
