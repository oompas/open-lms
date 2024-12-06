import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { CourseService } from "../_shared/Service/Services.ts";

const setCourseVisibility = async (request: EdgeFunctionRequest) => {

    const { courseId, active } = request.getPayload();

    await CourseService.setActiveStatus(courseId, active);

    return null;
}

export default setCourseVisibility;
