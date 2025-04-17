import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const setCourseVisibility = async (request: EdgeFunctionRequest) => {

    const { courseId, active } = request.getPayload();

    request.log(`Entering setCourseVisibility with courseId: ${courseId} and active: ${active}`);

    await CourseService.setActiveStatus(courseId, active);

    request.log(`Course successfully set to ${active ? "active" : "inactive"}`);

    return null;
}

export default setCourseVisibility;
