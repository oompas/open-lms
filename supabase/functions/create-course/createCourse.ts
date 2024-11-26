import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";

const createCourse = async (request: EdgeFunctionRequest) => {

    const userId: string = request.getRequestUserId();

    request.log(`Entering createCourse for user ${userId}`);

    const { course } = request.getPayload();

    request.log(`Incoming course data: ${JSON.stringify(course)}`);

    const courseData = {
        user_id: userId,
        name: course.name,
        description: course.description,
        link: course.link,
        min_time: course.minTime,
    };

    const { data, error } = await adminClient.from('course').insert(courseData);

    if (error) {
        throw error;
    }

    request.log(`Course added to database!`);

    return data;
}

export default createCourse;
