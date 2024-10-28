import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { HandleEndpointError, OptionsRsp, SuccessResponse } from "../_shared/response.ts";
import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import getCourseData from "../get-course-data/getCourseData.ts";

const ENDPOINT_NAME = "get-quiz";

Deno.serve(async (req: Request) => {

    const request = new EdgeFunctionRequest(ENDPOINT_NAME, req, { courseId: z.string() });

    try {
        if (req.method === 'OPTIONS') {
            return OptionsRsp();
        }

        await request.validateRequest();

        const rsp = await getCourseData(request);

        return SuccessResponse(rsp);
    } catch (err) {
        return await HandleEndpointError(request, err);
    }
});
