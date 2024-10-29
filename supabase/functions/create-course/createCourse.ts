import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";

const createCourse = async (request: EdgeFunctionRequest) => {

    const userId: string = request.getRequestUserId();
    const { course } = request.getPayload();

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

    return data;
}

export default createCourse;
