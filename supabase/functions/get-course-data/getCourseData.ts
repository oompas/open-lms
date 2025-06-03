import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import getCourseDataLearner from "./getCourseDataLearner.ts";
import getCourseDataAdmin from "./getCourseDataAdmin.ts";

const getCourseData = async (request: EdgeFunctionRequest): Promise<object> => {

    request.log(`Entering getCourseData...`);

    const userId: string = request.getRequestUserId();
    const { courseId, adminView } = request.getPayload();

    request.log(`User id: ${userId}. Course id: ${courseId}. Admin view? ${adminView}`);

    if (!adminView) {
        return getCourseDataLearner(request);
    }

    return getCourseDataAdmin(request);
}

export default getCourseData;
