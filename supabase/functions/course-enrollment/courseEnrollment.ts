import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { EnrollmentService } from "../_shared/Service/Services.ts";

const courseEnrollment = async (request: EdgeFunctionRequest) => {

    const userId = request.getRequestUserId();
    const { courseId } = request.getPayload();

    request.log(`Entering courseEnrollment with userId ${userId} and courseId ${courseId}`);

    const enrolled = await EnrollmentService.getEnrollment(userId, courseId);

    request.log(`User is currently ${!enrolled ? "not" : ""} enrolled in the course`);

    if (!enrolled) {
        await EnrollmentService.enrollInCourse(userId, courseId);
    } else {
        await EnrollmentService.unenrollInCourse(userId, courseId);
    }

    request.log(`Successfully ${enrolled ? "un" : ""}enrolled!`);

    return null;
}

export default courseEnrollment;
