import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const getCourses = async (request: EdgeFunctionRequest): Promise<object[]> => {

    request.log("Getting user ID, all active courses, and the user's enrollments...");

    const userId = request.getRequestUserId();

    const data = await CourseService
        .query(`
            id,
            name,
            description,
            min_time,
            total_quiz_marks,
            enrolled_course(status)
            `,
            [
                ['eq', 'active', true],
                ['eq', 'enrolled_course.user_id', userId]
            ]
        );

    request.log(`Request user id: '${userId}'. Queried ${data.length} courses`);

    const courseData = data
        .map((course: any) => {
            return {
                id: course.id,
                name: course.name,
                description: course.description,
                status: course.enrolled_course[0]?.status ?? "NOT_ENROLLED",
                minTime: course.min_time,
                total_quiz_marks: course.total_quiz_marks,
            }
        });

    request.log("Returning data successfully...");

    return courseData;
}

export default getCourses;
