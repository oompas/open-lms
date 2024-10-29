import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";

const setCourseVisibility = async (request: EdgeFunctionRequest) => {

    const { courseId, active } = request.getPayload();

    const { data, error } = await adminClient.from('course').update({ active: active }).eq('id', courseId);
    if (error) {
        throw error;
    }

    return null;
}

export default setCourseVisibility;
