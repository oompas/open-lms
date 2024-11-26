import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const courseEnrollment = async (request: EdgeFunctionRequest) => {

    const userId = request.getRequestUserId();
    const { courseId } = request.getPayload();

    const course = await CourseService.query('*', [['eq', 'user_id', userId], ['eq', 'course_id', courseId]]);

    if (course.length === 0) {
        const { error: error2 } = await adminClient.from('enrolled_course').insert({ user_id: userId, course_id: courseId });

        if (error2) {
            throw error2;
        }
    } else {
        const { error: error3 } = await adminClient.from('enrolled_course').delete().eq('user_id', userId).eq('course_id', courseId);

        if (error3) {
            throw error3;
        }
    }

    return { enrolled: course.length === 0 };
}

export default courseEnrollment;
