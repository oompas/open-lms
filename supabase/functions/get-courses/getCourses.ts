import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const getCourses = async (request: EdgeFunctionRequest) => {

    request.log("Getting user ID, all courses, and user's enrollments...");

    const userId = request.getRequestUser().id;
    const data = await CourseService
        .query(`
            id,
            name,
            description,
            min_time,
            quiz_time_limit,
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
                maxQuizTime: course.quiz_time_limit,
            }
        });

    request.log("Returning success...");

    return courseData;
}

export default getCourses;
