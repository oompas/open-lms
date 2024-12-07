import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseAttemptService, EnrollmentService } from "../_shared/Service/Services.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";

const startCourse = async (request: EdgeFunctionRequest): Promise<any> => {

    const userId = request.getRequestUserId();
    const { courseId } = request.getPayload();

    request.log(`Entered startCourse with userId ${userId} and courseId ${courseId}`);

    await CourseAttemptService.startAttempt(courseId, userId);

    request.log(`Successfully started course attempt`);

    await EnrollmentService.updateStatus(userId, courseId, CourseStatus.IN_PROGRESS);

    request.log(`Successfully updated course status to IN_PROGRESS`);

    return null;
}

export default startCourse;
