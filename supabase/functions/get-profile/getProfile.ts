import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";
import { CourseAttemptService } from "../_shared/Service/Services.ts";

const getProfile = async (request: EdgeFunctionRequest): Promise<object> => {

    const user = request.getRequestUser();

    const c = await CourseAttemptService.query('*, course(*)', [['eq', 'user_id', user.id], ['eq', 'pass', true]]);

    request.log(`course data: ${JSON.stringify(c)}`);

    const completedCoursesQuery = await getRows({ table: 'course_attempt', conditions: [['eq', 'user_id', user.id], ['eq', 'pass', true]] });
    if (completedCoursesQuery instanceof Response) return completedCoursesQuery;

    const completedCourses = await Promise.all(completedCoursesQuery.map(async (courseAttempt) => {
        const course = await getRows({ table: 'course', conditions: ['eq', 'id', courseAttempt.course_id] });
        return {
            courseId: courseAttempt.id,
            name: course[0].name,
            date: courseAttempt.end_time
        };
    }));

    return {
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role,
        signUpDate: user.created_at,
        completedCourses: completedCourses
    }
}

export default getProfile;
