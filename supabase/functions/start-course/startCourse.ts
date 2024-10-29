import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { EnrollmentService } from "../_shared/Service/Services.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";

const startCourse = async (request: EdgeFunctionRequest) => {

    const userId = request.getRequestUserId();
    const { courseId } = request.getPayload();

    const courseAttempt = {
        course_id: courseId,
        user_id: userId
    };

    const { data, error } = await adminClient.from('course_attempt').insert(courseAttempt);

    await EnrollmentService.updateStatus(courseId, userId, CourseStatus.IN_PROGRESS);

    if (error) {
        throw error;
    }

    return data;
}

export default startCourse;
