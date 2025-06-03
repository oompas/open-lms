import { CourseAttemptService } from "../_shared/Service/Services.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";

const getCurrentUserProfile = async (request: EdgeFunctionRequest): Promise<object> => {

    const user = request.getRequestUser();

    request.log(`Entering getProfile for user ${user.email}`);

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
        name: user.user_metadata.display_name,
        email: user.email,
        role: user.app_metadata.role ?? "Learner",
        signUpDate: user.created_at,
        completedCourses: completedCourseData
    }
}

export default getCurrentUserProfile;
